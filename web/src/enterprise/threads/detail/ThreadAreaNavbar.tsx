import React from 'react'
import { NavLink } from 'react-router-dom'
import * as GQL from '../../../../../shared/src/graphql/schema'
import { ThreadSettings } from '../settings'

interface Props {
    thread: GQL.IDiscussionThread
    threadSettings: ThreadSettings
    sections: { review: boolean; actions: boolean; settings: boolean }
    className?: string
}

/**
 * The navbar for a single thread.
 */
export const ThreadAreaNavbar: React.FunctionComponent<Props> = ({
    thread,
    threadSettings,
    sections,
    className = '',
}) => (
    <div className={`thread-area-navbar border-top border-bottom ${className}`}>
        <div className="container px-0">
            <ul className="nav nav-pills">
                <li className="nav-item">
                    <NavLink
                        to={thread.url}
                        exact={true}
                        className="thread-area-navbar__nav-link nav-link rounded-0"
                        activeClassName="thread-area-navbar__nav-link--active"
                    >
                        Discussion <span className="badge badge-secondary">{thread.comments.totalCount - 1}</span>
                    </NavLink>
                </li>
                {sections.review && (
                    <li className="nav-item">
                        <NavLink
                            to={`${thread.url}/inbox`}
                            exact={true}
                            className="thread-area-navbar__nav-link nav-link rounded-0"
                            activeClassName="thread-area-navbar__nav-link--active"
                        >
                            Inbox <span className="badge badge-secondary">{thread.targets.totalCount}</span>
                        </NavLink>
                    </li>
                )}
                {sections.actions && (
                    <li className="nav-item">
                        <NavLink
                            to={`${thread.url}/actions`}
                            exact={true}
                            className="thread-area-navbar__nav-link nav-link rounded-0"
                            activeClassName="thread-area-navbar__nav-link--active"
                        >
                            Actions{' '}
                            {threadSettings.createPullRequests && <span className="badge badge-secondary">50%</span>}
                        </NavLink>
                    </li>
                )}
                {sections.settings && (
                    <li className="nav-item">
                        <NavLink
                            to={`${thread.url}/settings`}
                            exact={true}
                            className="thread-area-navbar__nav-link nav-link rounded-0"
                            activeClassName="thread-area-navbar__nav-link--active"
                        >
                            Settings
                        </NavLink>
                    </li>
                )}
            </ul>
        </div>
    </div>
)
