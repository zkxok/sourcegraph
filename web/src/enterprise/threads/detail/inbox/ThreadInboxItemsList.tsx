import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import H from 'history'
import React, { useCallback, useMemo, useState } from 'react'
import { map } from 'rxjs/operators'
import { WithStickyTop } from '../../../../../../shared/src/components/withStickyTop/WithStickyTop'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import { gql } from '../../../../../../shared/src/graphql/graphql'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { asError, createAggregateError, ErrorLike, isErrorLike } from '../../../../../../shared/src/util/errors'
import { queryGraphQL } from '../../../../backend/graphql'
import { discussionThreadTargetFieldsFragment } from '../../../../discussions/backend'
import { QueryParameterProps } from '../../components/withQueryParameter/WithQueryParameter'
import { ThreadSettings } from '../../settings'
import { TextDocumentLocationInboxItem } from './TextDocumentLocationItem'
import { ThreadInboxItemsNavbar } from './ThreadInboxItemsNavbar'

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
    thread: Pick<GQL.IDiscussionThread, 'id' | 'idWithoutKind' | 'title' | 'type' | 'settings'>
    onThreadUpdate: (thread: GQL.IDiscussionThread) => void
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
    onThreadUpdate,
    threadSettings,
    query,
    onQueryChange,
    history,
    location,
    isLightTheme,
    extensionsController,
}) => {
    const [itemsOrError, setItemsOrError] = useState<
        | typeof LOADING
        | (GQL.IDiscussionThreadTargetConnection & { matchingNodes: GQL.IDiscussionThreadTargetRepo[] })
        | ErrorLike
    >(LOADING)

    // tslint:disable-next-line: no-floating-promises
    useMemo(async () => {
        try {
            const data = await queryInboxItems(thread.id)
            setItemsOrError({
                ...data,
                matchingNodes: data.nodes
                    .filter(
                        (item): item is GQL.IDiscussionThreadTargetRepo =>
                            item.__typename === 'DiscussionThreadTargetRepo'
                    )
                    .filter(
                        item =>
                            (query.includes('is:open') && !item.isIgnored) ||
                            (query.includes('is:ignored') && item.isIgnored) ||
                            (!query.includes('is:open') && !query.includes('is:ignored'))
                    )
                    .filter(item => {
                        const m = query.match(/repo:([^\s]+)/)
                        if (m && m[1]) {
                            const repo = m[1]
                            const ids = (threadSettings.pullRequests || [])
                                .filter(pull => pull.repo === repo)
                                .flatMap(pull => pull.items)
                            return ids.includes(item.id)
                        }
                        return true
                    }),
            })
        } catch (err) {
            setItemsOrError(asError(err))
        }
    }, [thread.id, threadSettings])

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
                                    onThreadUpdate={onThreadUpdate}
                                    threadSettings={threadSettings}
                                    items={itemsOrError}
                                    query={query}
                                    onQueryChange={onQueryChange}
                                    includeThreadInfo={isStuck}
                                    className={`sticky-top position-sticky row bg-body thread-inbox-items-list__navbar py-2 px-3 ${
                                        isStuck ? 'border-bottom shadow' : ''
                                    }`}
                                    location={location}
                                    extensionsController={extensionsController}
                                />
                            )}
                        </WithStickyTop>
                    )}
                    {itemsOrError === LOADING ? (
                        <LoadingSpinner className="mt-2" />
                    ) : itemsOrError.matchingNodes.length === 0 ? (
                        <p className="p-2 mb-0 text-muted">Inbox is empty.</p>
                    ) : (
                        <ul className="list-unstyled">
                            {itemsOrError.matchingNodes.map((item, i) => (
                                <li key={i}>
                                    <TextDocumentLocationInboxItem
                                        key={i}
                                        thread={thread}
                                        threadSettings={threadSettings}
                                        onThreadUpdate={onThreadUpdate}
                                        inboxItem={item}
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
