import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import H from 'history'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { from, Subscription } from 'rxjs'
import { catchError, map, startWith } from 'rxjs/operators'
import * as sourcegraph from 'sourcegraph'
import { WithStickyTop } from '../../../../../../shared/src/components/withStickyTop/WithStickyTop'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import { gql } from '../../../../../../shared/src/graphql/graphql'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { PlatformContextProps } from '../../../../../../shared/src/platform/context'
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

interface Props extends QueryParameterProps, ExtensionsControllerProps, PlatformContextProps {
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
    extensionsController,
    ...props
}) => {
    const [items0OrError, setItems0OrError] = useState<
        | typeof LOADING
        | (GQL.IDiscussionThreadTargetConnection & { matchingNodes: GQL.IDiscussionThreadTargetRepo[] })
        | ErrorLike
    >(LOADING)
    // tslint:disable-next-line: no-floating-promises
    useMemo(async () => {
        try {
            const data = await queryInboxItems(thread.id)
            const isHandled = (item: GQL.IDiscussionThreadTargetRepo): boolean =>
                (threadSettings.pullRequests || []).some(pull => pull.items.includes(item.id))
            setItems0OrError({
                ...data,
                matchingNodes: data.nodes
                    .filter(
                        (item): item is GQL.IDiscussionThreadTargetRepo =>
                            item.__typename === 'DiscussionThreadTargetRepo'
                    )
                    .filter(
                        item =>
                            (query.includes('is:open') && !item.isIgnored && !isHandled(item)) ||
                            (query.includes('is:ignored') && item.isIgnored && !isHandled(item)) ||
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
            setItems0OrError(asError(err))
        }
    }, [thread.id, threadSettings])

    const [itemsOrError, setItemsOrError] = useState<typeof LOADING | [URL, sourcegraph.Diagnostic[]][] | ErrorLike>(
        LOADING
    )
    // tslint:disable-next-line: no-floating-promises
    useEffect(() => {
        const subscriptions = new Subscription()
        subscriptions.add(
            from(extensionsController.services.diagnostics.collection.changes)
                .pipe(
                    map(() => Array.from(extensionsController.services.diagnostics.collection.entries())),
                    catchError(err => [asError(err)]),
                    startWith(LOADING)
                )
                .subscribe(setItemsOrError)
        )
        return () => subscriptions.unsubscribe()
    }, [thread.id, threadSettings, extensionsController])

    const onInboxItemUpdate = useCallback(
        (updatedItem: GQL.DiscussionThreadTarget) => {
            if (items0OrError !== LOADING && !isErrorLike(items0OrError)) {
                setItems0OrError({
                    ...items0OrError,
                    nodes: items0OrError.nodes.map(item => {
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
        [items0OrError]
    )

    return (
        <div className="thread-inbox-items-list position-relative">
            {isErrorLike(itemsOrError) ? (
                <div className="alert alert-danger mt-2">{itemsOrError.message}</div>
            ) : (
                <>
                    {itemsOrError !== LOADING &&
                        !isErrorLike(itemsOrError) &&
                        /* TODO!(sqs) <WithStickyTop scrollContainerSelector=".thread-area">
                            {({ isStuck }) => (
                                <ThreadInboxItemsNavbar
                                    {...props}
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
                                    extensionsController={extensionsController}
                                />
                            )}
                                </WithStickyTop>*/ ''}
                    {itemsOrError === LOADING ? (
                        <LoadingSpinner className="mt-2" />
                    ) : itemsOrError.length === 0 ? (
                        <p className="p-2 mb-0 text-muted">Inbox is empty.</p>
                    ) : (
                        <ul className="list-unstyled">
                            {itemsOrError.map((item0, i) => (
                                <li key={i}>
                                    <TextDocumentLocationInboxItem
                                        {...props}
                                        key={i}
                                        thread={thread}
                                        threadSettings={threadSettings}
                                        onThreadUpdate={onThreadUpdate}
                                        inboxItem={item0}
                                        onInboxItemUpdate={onInboxItemUpdate}
                                        className="my-3"
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
