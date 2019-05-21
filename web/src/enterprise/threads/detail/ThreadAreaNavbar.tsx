import InboxIcon from 'mdi-react/InboxIcon'
import PlayCircleIcon from 'mdi-react/PlayCircleIcon'
import SettingsIcon from 'mdi-react/SettingsIcon'
import React from 'react'
import { NavLink } from 'react-router-dom'
import { ChatIcon } from '../../../../../shared/src/components/icons'
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
            <div className="nav nav-pills flex-nowrap">
                <div className="nav-item">
                    <NavLink
                        to={thread.url}
                        exact={true}
                        className="thread-area-navbar__nav-link nav-link rounded-0"
                        activeClassName="thread-area-navbar__nav-link--active"
                    >
                        <ChatIcon className="icon-inline" /> Discussion{' '}
                        <span className="badge badge-secondary">{thread.comments.totalCount - 1}</span>
                    </NavLink>
                </div>
                {sections.review && (
                    <div className="nav-item">
                        <NavLink
                            to={`${thread.url}/inbox`}
                            className="thread-area-navbar__nav-link nav-link rounded-0"
                            activeClassName="thread-area-navbar__nav-link--active"
                        >
                            <InboxIcon className="icon-inline" /> Inbox{' '}
                            <span className="badge badge-secondary">{thread.targets.totalCount}</span>
                        </NavLink>
                    </div>
                )}
                {sections.actions && (
                    <div className="nav-item">
                        <NavLink
                            to={`${thread.url}/actions/pull-requests`}
                            className="thread-area-navbar__nav-link nav-link rounded-0"
                            activeClassName="thread-area-navbar__nav-link--active"
                        >
                            <PlayCircleIcon className="icon-inline" /> Actions
                        </NavLink>
                    </div>
                )}
                <div className="flex-1" />
                {sections.settings && (
                    <div className="nav-item">
                        <NavLink
                            to={`${thread.url}/settings`}
                            className="thread-area-navbar__nav-link nav-link rounded-0"
                            activeClassName="thread-area-navbar__nav-link--active"
                        >
                            <SettingsIcon className="icon-inline" />
                        </NavLink>
                    </div>
                )}
            </div>
        </div>
    </div>
)
