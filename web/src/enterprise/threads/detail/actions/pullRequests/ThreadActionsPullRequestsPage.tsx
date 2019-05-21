import H from 'history'
import React from 'react'
import { ExtensionsControllerProps } from '../../../../../../../shared/src/extensions/controller'
import { WithQueryParameter } from '../../../components/withQueryParameter/WithQueryParameter'
import { ThreadCreatePullRequestsButton } from '../../../form/ThreadCreatePullRequestsButton'
import { threadsQueryWithValues } from '../../../url'
import { ThreadPullRequestTemplateEditForm } from '../../settings/ThreadPullRequestTemplateEditForm'
import { ThreadAreaContext } from '../../ThreadArea'
import { ThreadActionsPullRequestsList } from './ThreadActionsPullRequestsList'

interface Props extends ThreadAreaContext, ExtensionsControllerProps {
    history: H.History
    location: H.Location
}

/**
 * The page showing pull request actions for a single thread.
 */
export const ThreadActionsPullRequestsPage: React.FunctionComponent<Props> = ({
    thread,
    onThreadUpdate,
    threadSettings,
    ...props
}) => (
    <div className="thread-actions-pull-requests-page">
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
        <WithQueryParameter
            defaultQuery={threadsQueryWithValues('', { is: ['open', 'pending'] })}
            history={props.history}
            location={props.location}
        >
            {({ query, onQueryChange }) => (
                <ThreadActionsPullRequestsList
                    {...props}
                    thread={thread}
                    onThreadUpdate={onThreadUpdate}
                    threadSettings={threadSettings}
                    query={query}
                    onQueryChange={onQueryChange}
                    action={
                        threadSettings.pullRequestTemplate && (
                            <ThreadCreatePullRequestsButton
                                {...props}
                                thread={thread}
                                onThreadUpdate={onThreadUpdate}
                                threadSettings={threadSettings}
                            />
                        )
                    }
                />
            )}
        </WithQueryParameter>
    </div>
)
