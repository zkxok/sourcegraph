import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import H from 'history'
import CheckCircleIcon from 'mdi-react/CheckCircleIcon'
import CloseCircleIcon from 'mdi-react/CloseCircleIcon'
import DotsHorizontalCircleIcon from 'mdi-react/DotsHorizontalCircleIcon'
import SourcePullIcon from 'mdi-react/SourcePullIcon'
import React, { useMemo, useState } from 'react'
import { of } from 'rxjs'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { asError, ErrorLike, isErrorLike } from '../../../../../../shared/src/util/errors'
import { ListHeaderQueryLinksNav } from '../../components/ListHeaderQueryLinks'
import { PullRequest, ThreadSettings } from '../../settings'
import { PullRequestStatusItem } from './PullRequestStatusItem'
import { ThreadStatusItemsListHeaderFilterButtonDropdown } from './ThreadStatusItemsListHeaderFilterButtonDropdown'
import { ThreadStatusItemsProgressBar } from './ThreadStatusItemsProgressBar'

export const STATUS_ITEMS: PullRequest[] = [
    {
        repo: 'github.com/sourcegraph/sourcegraph',
        number: 2319,
        status: 'pending',
        commentsCount: 73,
    },
    {
        repo: 'github.com/sourcegraph/go-diff',
        number: 87,
        status: 'open',
        commentsCount: 1,
    },
    {
        repo: 'github.com/sourcegraph/codeintellify',
        label: 'client/chrome/',
        number: 1841,
        status: 'open',
        commentsCount: 7,
    },
    {
        repo: 'github.com/sourcegraph/codeintellify',
        label: 'client/firefox/',
        number: 1842,
        status: 'open',
        commentsCount: 2,
    },
    {
        repo: 'github.com/sourcegraph/csp',
        number: 9,
        status: 'closed',
        commentsCount: 5,
    },
    {
        repo: 'github.com/sourcegraph/sitemap',
        number: 48,
        status: 'closed',
        commentsCount: 0,
    },
    {
        repo: 'github.com/sourcegraph/sourcegraph-lightstep',
        number: 51,
        status: 'merged',
        commentsCount: 1,
    },
    {
        repo: 'github.com/sourcegraph/docsite',
        label: 'cmd/docsite/',
        number: 149,
        status: 'merged',
        commentsCount: 5,
    },
    {
        repo: 'github.com/sourcegraph/docsite',
        label: 'pkg/markdown/',
        number: 150,
        status: 'merged',
        commentsCount: 2,
    },
    {
        repo: 'github.com/sourcegraph/thyme',
        number: 147,
        status: 'merged',
        commentsCount: 21,
    },
    {
        repo: 'github.com/sourcegraph/sourcegraph-git-extras',
        number: 511,
        status: 'merged',
        commentsCount: 2,
    },
]

const queryStatusItems = (_threadID: string, createPullRequests?: boolean) =>
    of({
        nodes: createPullRequests ? STATUS_ITEMS : STATUS_ITEMS.map(d => ({ ...d, status: 'pending' as const })),
        totalCount: STATUS_ITEMS.length,
    })

interface Props {
    thread: Pick<GQL.IDiscussionThread, 'id'>
    threadSettings: ThreadSettings

    action?: React.ReactFragment

    location: H.Location
}

const LOADING: 'loading' = 'loading'

/**
 * The list of thread status items.
 */
export const ThreadStatusItemsList: React.FunctionComponent<Props> = ({ thread, threadSettings, action, location }) => {
    const [itemsOrError, setItemsOrError] = useState<
        typeof LOADING | { nodes: typeof STATUS_ITEMS; totalCount: number } | ErrorLike
    >(LOADING)

    // tslint:disable-next-line: no-floating-promises because queryStatusItems never throws
    useMemo(async () => {
        try {
            setItemsOrError(await queryStatusItems(thread.id, threadSettings.createPullRequests).toPromise())
        } catch (err) {
            setItemsOrError(asError(err))
        }
    }, [thread.id])

    return (
        <div className="thread-status-items-list">
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
                            <span className="mr-2">{threadSettings.createPullRequests ? '50%' : '0%'} complete</span>
                            {itemsOrError !== LOADING && !isErrorLike(itemsOrError) && (
                                <ListHeaderQueryLinksNav
                                    query={'TODO!(sqs)'}
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
                        <div className="d-flex">
                            <ThreadStatusItemsListHeaderFilterButtonDropdown
                                header="Filter by who's assigned"
                                items={['sqs (you)', 'ekonev', 'jleiner', 'ziyang', 'kting7', 'ffranksena']}
                            >
                                Assignee
                            </ThreadStatusItemsListHeaderFilterButtonDropdown>
                            <ThreadStatusItemsListHeaderFilterButtonDropdown
                                header="Sort by"
                                items={['Priority', 'Most recently updated', 'Least recently updated']}
                            >
                                Sort
                            </ThreadStatusItemsListHeaderFilterButtonDropdown>
                            {action}
                        </div>
                    </div>
                    {threadSettings.createPullRequests && <ThreadStatusItemsProgressBar />}
                    {itemsOrError === LOADING ? (
                        <LoadingSpinner className="mt-2" />
                    ) : itemsOrError.nodes.length === 0 ? (
                        <p className="p-2 mb-0 text-muted">No status items found.</p>
                    ) : (
                        <div className="list-group list-group-flush">
                            {itemsOrError.nodes.map((data, i) => (
                                <PullRequestStatusItem key={i} {...data} className="list-group-item p-2" />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
