import H from 'history'
import MessageOutlineIcon from 'mdi-react/MessageOutlineIcon'
import React from 'react'
import { Link } from 'react-router-dom'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { ThreadStatusIcon } from '../../../threads/components/threadStatus/ThreadStatusIcon'

interface Props {
    thread: GQL.IDiscussionThread
    location: H.Location
}

/**
 * A list item for a check thread in {@link CheckThreadsList}.
 */
export const CheckThreadsListItem: React.FunctionComponent<Props> = ({ thread }) => (
    <li className="list-group-item p-3">
        <div className="d-flex align-items-start">
            <ThreadStatusIcon thread={thread} className={`small mr-2 mt-1`} />
            <div className="flex-1">
                <h3 className="d-flex align-items-center mb-0">
                    <Link to={thread.url} className="text-body">
                        {thread.title}
                    </Link>
                    <span className="badge badge-secondary ml-1 d-none">123</span> {/* TODO!(sqs) */}
                </h3>
            </div>
            <div>
                <ul className="list-inline d-flex align-items-center">
                    {thread.comments.totalCount > 0 && (
                        <li className="list-inline-item">
                            <small className="text-muted">
                                <MessageOutlineIcon className="icon-inline" /> {thread.comments.totalCount}
                            </small>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    </li>
)
