import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import H from 'history'
import CheckCircleIcon from 'mdi-react/CheckCircleIcon'
import CloseCircleIcon from 'mdi-react/CloseCircleIcon'
import DotsHorizontalCircleIcon from 'mdi-react/DotsHorizontalCircleIcon'
import SourcePullIcon from 'mdi-react/SourcePullIcon'
import React, { useMemo, useState } from 'react'
import { ExtensionsControllerProps } from '../../../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../../../shared/src/graphql/schema'
import { asError, ErrorLike, isErrorLike } from '../../../../../../../shared/src/util/errors'
import { ListHeaderQueryLinksNav } from '../../../components/ListHeaderQueryLinks'
import { QueryParameterProps } from '../../../components/withQueryParameter/WithQueryParameter'
import { PullRequest, ThreadSettings } from '../../../settings'
import { ThreadStatusItemsProgressBar } from '../ThreadStatusItemsProgressBar'
import { ThreadActionsPullRequestListHeaderFilterButtonDropdown } from './ThreadActionsPullRequestListHeaderFilterButtonDropdown'
import { ThreadActionsPullRequestsListItem } from './ThreadActionsPullRequestsListItem'

interface PullRequestConnection {
    nodes: PullRequest[]
    matchingNodes: PullRequest[]
    totalCount: number
}

const queryPullRequests = async (threadSettings: ThreadSettings, query: string): Promise<PullRequestConnection> => {
    const pulls = threadSettings.pullRequests || []
    return {
        nodes: pulls,
        matchingNodes: pulls.filter(
            node =>
                (query.includes('is:pending') && node.status === 'pending') ||
                (query.includes('is:open') && node.status === 'open') ||
                (query.includes('is:merged') && node.status === 'merged') ||
                (query.includes('is:closed') && node.status === 'closed') ||
                !query.includes('is:')
        ),
        totalCount: pulls.length,
    }
}

interface Props extends QueryParameterProps, ExtensionsControllerProps {
    thread: Pick<GQL.IDiscussionThread, 'id' | 'url'>
    onThreadUpdate: (thread: GQL.IDiscussionThread) => void
    threadSettings: ThreadSettings

    action?: React.ReactFragment

    location: H.Location
}

const LOADING: 'loading' = 'loading'

/**
 * The list of pull requests associated with a thread.
 */
export const ThreadActionsPullRequestsList: React.FunctionComponent<Props> = ({
    thread,
    onThreadUpdate,
    threadSettings,
    query,
    onQueryChange,
    action,
    location,
    extensionsController,
}) => {
    const [itemsOrError, setItemsOrError] = useState<typeof LOADING | PullRequestConnection | ErrorLike>(LOADING)

    // tslint:disable-next-line: no-floating-promises because this never throws
    useMemo(async () => {
        try {
            setItemsOrError(await queryPullRequests(threadSettings, query))
        } catch (err) {
            setItemsOrError(asError(err))
        }
    }, [threadSettings, query])

    return (
        <div className="thread-actions-pull-requests-list">
            {isErrorLike(itemsOrError) ? (
                <div className="alert alert-danger mt-2">{itemsOrError.message}</div>
            ) : (
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div className="form-check mx-2">
                            <input
                                className="form-check-input position-static"
                                type="checkbox"
                                aria-label="Select item"
                            />
                        </div>
                        <div className="font-weight-normal flex-1 d-flex align-items-center">
                            {/* TODO!(sqs) <span className="mr-2">{threadSettings.createPullRequests ? '50%' : '0%'} complete</span>*/}
                            {itemsOrError !== LOADING && !isErrorLike(itemsOrError) && (
                                <ListHeaderQueryLinksNav
                                    query={query}
                                    links={[
                                        {
                                            label: 'pending',
                                            queryField: 'is',
                                            queryValues: ['pending'],
                                            count: itemsOrError.nodes.filter(({ status }) => status === 'pending')
                                                .length,
                                            icon: DotsHorizontalCircleIcon,
                                        },
                                        {
                                            label: 'open',
                                            queryField: 'is',
                                            queryValues: ['open'],
                                            count: itemsOrError.nodes.filter(({ status }) => status === 'open').length,
                                            icon: SourcePullIcon,
                                        },
                                        {
                                            label: 'merged',
                                            queryField: 'is',
                                            queryValues: ['merged'],
                                            count: itemsOrError.nodes.filter(({ status }) => status === 'merged')
                                                .length,
                                            icon: CheckCircleIcon,
                                        },
                                        {
                                            label: 'closed',
                                            queryField: 'is',
                                            queryValues: ['closed'],
                                            count: itemsOrError.nodes.filter(({ status }) => status === 'closed')
                                                .length,
                                            icon: CloseCircleIcon,
                                        },
                                    ]}
                                    location={location}
                                    className="flex-1"
                                />
                            )}
                        </div>
                        {/* TODO!(sqs) <div className="d-flex">
                            <ThreadActionsPullRequestListHeaderFilterButtonDropdown
                                header="Filter by who's assigned"
                                items={['sqs (you)', 'ekonev', 'jleiner', 'ziyang', 'kting7', 'ffranksena']}
                            >
                                Assignee
                            </ThreadActionsPullRequestListHeaderFilterButtonDropdown>
                            <ThreadActionsPullRequestListHeaderFilterButtonDropdown
                                header="Sort by"
                                items={['Priority', 'Most recently updated', 'Least recently updated']}
                            >
                                Sort
                            </ThreadActionsPullRequestListHeaderFilterButtonDropdown>
                            {action}
                                </div>*/}
                        {action}
                    </div>
                    {threadSettings.createPullRequests && <ThreadStatusItemsProgressBar />}
                    {itemsOrError === LOADING ? (
                        <LoadingSpinner className="mt-2" />
                    ) : itemsOrError.matchingNodes.length === 0 ? (
                        <p className="p-2 mb-0 text-muted">No pull requests found.</p>
                    ) : (
                        <div className="list-group list-group-flush">
                            {itemsOrError.matchingNodes.map((pull, i) => (
                                <ThreadActionsPullRequestsListItem
                                    key={i}
                                    thread={thread}
                                    onThreadUpdate={onThreadUpdate}
                                    threadSettings={threadSettings}
                                    pull={pull}
                                    className="list-group-item p-2"
                                    extensionsController={extensionsController}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
