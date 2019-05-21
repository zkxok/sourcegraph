import H from 'history'
import React from 'react'
import { ThreadCreatePullRequestsButton } from '../../../form/ThreadCreatePullRequestsButton'
import { ThreadPullRequestTemplateEditForm } from '../../settings/ThreadPullRequestTemplateEditForm'
import { ThreadAreaContext } from '../../ThreadArea'
import { ThreadStatusItemsList } from '../ThreadStatusItemsList'

interface Props extends ThreadAreaContext {
    history: H.History
    location: H.Location
}

/**
 * The pull request actions for a single thread.
 */
export const ThreadActionsPullRequests: React.FunctionComponent<Props> = ({
    thread,
    onThreadUpdate,
    threadSettings,
    ...props
}) => (
    <div className="thread-actions-pull-requests">
        {!threadSettings.pullRequestTemplate && (
            <div className="border rounded p-3 mb-3">
                <h2>Create pull request template</h2>
                <ThreadPullRequestTemplateEditForm
                    thread={thread}
                    onThreadUpdate={onThreadUpdate}
                    threadSettings={threadSettings}
                />
            </div>
        )}
        <ThreadStatusItemsList
            {...props}
            thread={thread}
            threadSettings={threadSettings}
            action={
                threadSettings.pullRequestTemplate &&
                !threadSettings.createPullRequests && (
                    <ThreadCreatePullRequestsButton
                        {...props}
                        thread={thread}
                        onThreadUpdate={onThreadUpdate}
                        threadSettings={threadSettings}
                    />
                )
            }
        />
    </div>
)
