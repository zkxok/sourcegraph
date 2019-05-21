import H from 'history'
import React from 'react'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { ErrorLike } from '../../../../../../shared/src/util/errors'
import { CheckThreadActivationStatusButton } from '../../../checks/threads/form/CheckThreadActivationStatusButton'
import { ThreadDeleteButton } from '../../form/ThreadDeleteButton'
import { ThreadStatusButton } from '../../form/ThreadStatusButton'
import { ThreadSettings } from '../../settings'
import { ThreadPullRequestTemplateEditForm } from './ThreadPullRequestTemplateEditForm'
import { ThreadSettingsEditForm } from './ThreadSettingsEditForm'

interface Props extends ExtensionsControllerProps {
    thread: GQL.IDiscussionThread
    threadSettings: ThreadSettings
    onThreadUpdate: (thread: GQL.IDiscussionThread | ErrorLike) => void
    isLightTheme: boolean
    history: H.History
}

/**
 * The settings page for a single thread.
 */
export const ThreadSettingsPage: React.FunctionComponent<Props> = ({ thread, ...props }) => (
    <div className="thread-settings-page container">
        <div className="card d-none">
            {/* TODO!(sqs): add back */}
            <h4 className="card-header">Pull request template</h4>
            <div className="card-body">
                <ThreadPullRequestTemplateEditForm {...props} thread={thread} />
            </div>
        </div>
        <ThreadSettingsEditForm {...props} thread={thread} />
    </div>
)
