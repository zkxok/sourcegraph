import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import H from 'history'
import React, { useCallback, useMemo, useState } from 'react'
import { from, of } from 'rxjs'
import { first, map, switchMap } from 'rxjs/operators'
import { WithStickyTop } from '../../../../../../shared/src/components/withStickyTop/WithStickyTop'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import { gql } from '../../../../../../shared/src/graphql/graphql'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { asError, createAggregateError, ErrorLike, isErrorLike } from '../../../../../../shared/src/util/errors'
import { queryGraphQL } from '../../../../backend/graphql'
import { addTargetToThread, discussionThreadTargetFieldsFragment } from '../../../../discussions/backend'
import { search } from '../../../../search/backend'
import { QueryParameterProps } from '../../components/withQueryParameter/WithQueryParameter'
import { ThreadSettings } from '../../settings'
import { TextDocumentLocationInboxItem } from './TextDocumentLocationItem'
import { ThreadInboxItemsNavbar } from './ThreadInboxItemsNavbar'

const queryMatches = (
    query: string,
    threadID: GQL.ID,
    { extensionsController }: ExtensionsControllerProps
): Promise<GQL.IDiscussionThreadTargetConnection> =>
    search(query, { extensionsController })
        .pipe(
            switchMap(r => {
                if (isErrorLike(r)) {
                    throw new Error(r.message)
                }

                const nodes = r.results
                    .filter((r): r is GQL.IFileMatch => r.__typename === 'FileMatch')
                    .map((r: GQL.IFileMatch) =>
                        addTargetToThread({
                            threadID,
                            target: {
                                repo: {
                                    repositoryID: r.repository.id,
                                    revision: r.file.commit.oid,
                                    path: r.file.path,
                                    selection: {
                                        startLine: r.lineMatches[0].lineNumber,
                                        endLine: r.lineMatches[0].lineNumber,
                                        startCharacter: r.lineMatches[0].offsetAndLengths[0][0],
                                        endCharacter:
                                            r.lineMatches[0].offsetAndLengths[0][0] +
                                            r.lineMatches[0].offsetAndLengths[0][1],
                                    },
                                },
                            },
                        }).toPromise()
                    )

                return from(Promise.all(nodes)).pipe(
                    map(nodes => ({
                        __typename: 'DiscussionThreadTargetConnection' as const,
                        nodes,
                        totalCount: r.resultCount,
                        pageInfo: { __typename: 'PageInfo' as const, hasNextPage: r.limitHit },
                    }))
                )
            }),
            first()
        )
        .toPromise()

// TODO!(sqs): use relative path/rev for DiscussionThreadTargetRepo
const queryInboxItems = (threadID: GQL.ID): Promise<GQL.IDiscussionThreadTargetConnection> =>
    queryGraphQL(
        gql`
            query ThreadInboxItems($threadID: ID!) {
                node(id: $threadID) {
                    __typename
                    ... on DiscussionThread {
                        targets {
                            nodes {
                                __typename
                                ...DiscussionThreadTargetFields
                            }
                            totalCount
                            pageInfo {
                                hasNextPage
                            }
                        }
                    }
                }
            }
            ${discussionThreadTargetFieldsFragment}
        `,
        { threadID }
    )
        .pipe(
            map(({ data, errors }) => {
                if (
                    !data ||
                    !data.node ||
                    data.node.__typename !== 'DiscussionThread' ||
                    !data.node.targets ||
                    !data.node.targets.nodes
                ) {
                    throw createAggregateError(errors)
                }
                return data.node.targets
            })
        )
        .toPromise()

interface Props extends ExtensionsControllerProps, QueryParameterProps {
    thread: Pick<GQL.IDiscussionThread, 'id' | 'title' | 'type'>
    threadSettings: ThreadSettings

    history: H.History
    location: H.Location
    isLightTheme: boolean
}

const LOADING: 'loading' = 'loading'

/**
 * The list of thread inbox items.
 */
export const ThreadInboxItemsList: React.FunctionComponent<Props> = ({
    thread,
    threadSettings,
    query,
    onQueryChange,
    history,
    location,
    isLightTheme,
    extensionsController,
}) => {
    const [itemsOrError, setItemsOrError] = useState<
        typeof LOADING | GQL.IDiscussionThreadTargetConnection | ErrorLike
    >(LOADING)

    // tslint:disable-next-line: no-floating-promises
    useMemo(async () => {
        try {
            setItemsOrError(
                thread.type === GQL.ThreadType.CHECK
                    ? await queryMatches(threadSettings.queries || '', thread.id, { extensionsController })
                    : await queryInboxItems(thread.id)
            )
        } catch (err) {
            setItemsOrError(asError(err))
        }
    }, [thread.id])

    const onInboxItemUpdate = useCallback(
        (updatedItem: GQL.DiscussionThreadTarget) => {
            if (itemsOrError !== LOADING && !isErrorLike(itemsOrError)) {
                setItemsOrError({
                    ...itemsOrError,
                    nodes: itemsOrError.nodes.map(item => {
                        if (
                            updatedItem.__typename === 'DiscussionThreadTargetRepo' &&
                            item.__typename === 'DiscussionThreadTargetRepo' &&
                            updatedItem.id === item.id
                        ) {
                            return updatedItem
                        }
                        return item
                    }),
                })
            }
        },
        [itemsOrError]
    )

    return (
        <div className="thread-inbox-items-list position-relative">
            {isErrorLike(itemsOrError) ? (
                <div className="alert alert-danger mt-2">{itemsOrError.message}</div>
            ) : (
                <>
                    {itemsOrError !== LOADING && !isErrorLike(itemsOrError) && (
                        <WithStickyTop scrollContainerSelector=".thread-area">
                            {({ isStuck }) => (
                                <ThreadInboxItemsNavbar
                                    thread={thread}
                                    items={itemsOrError}
                                    query={query}
                                    onQueryChange={onQueryChange}
                                    includeThreadInfo={isStuck}
                                    className={`sticky-top position-sticky row bg-body thread-inbox-items-list__navbar py-2 px-3 ${
                                        isStuck ? 'border-top border-bottom shadow' : ''
                                    }`}
                                    location={location}
                                />
                            )}
                        </WithStickyTop>
                    )}
                    {itemsOrError === LOADING ? (
                        <LoadingSpinner className="mt-2" />
                    ) : itemsOrError.nodes.length === 0 ? (
                        <p className="p-2 mb-0 text-muted">Inbox is empty.</p>
                    ) : (
                        <ul className="list-unstyled">
                            {itemsOrError.nodes
                                .filter(
                                    (item): item is GQL.IDiscussionThreadTargetRepo =>
                                        item.__typename === 'DiscussionThreadTargetRepo'
                                )
                                .map((item, i) => (
                                    <li key={i}>
                                        <TextDocumentLocationInboxItem
                                            key={i}
                                            item={item}
                                            onInboxItemUpdate={onInboxItemUpdate}
                                            className="my-3"
                                            isLightTheme={isLightTheme}
                                            history={history}
                                            location={location}
                                            extensionsController={extensionsController}
                                        />
                                    </li>
                                ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    )
}
