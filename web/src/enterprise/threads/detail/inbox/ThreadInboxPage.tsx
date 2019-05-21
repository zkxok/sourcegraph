import H from 'history'
import React from 'react'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { ThreadSettings } from '../../settings'
import { ThreadInboxItemsList } from './ThreadInboxItemsList'

interface Props extends ExtensionsControllerProps {
    thread: GQL.IDiscussionThread
    onThreadUpdate: (thread: GQL.IDiscussionThread) => void
    threadSettings: ThreadSettings

    history: H.History
    location: H.Location
    isLightTheme: boolean
}

/** The default thread inbox query. */
const DEFAULT_QUERY = 'is:open'

/**
 * The inbox page for a single thread.
 */
export const ThreadInboxPage: React.FunctionComponent<Props> = ({
    thread,
    onThreadUpdate,
    threadSettings,
    ...props
}) => {
    const q = new URLSearchParams(location.search).get('q')
    const query = q === null ? DEFAULT_QUERY : q
    const onQueryChange = (query: string) => {
        const params = new URLSearchParams(location.search)
        params.set('q', query)
        props.history.push({ search: `${params}` })
    }

    return (
        <div className="thread-inbox-page container">
            <ThreadInboxItemsList
                {...props}
                thread={thread}
                onThreadUpdate={onThreadUpdate}
                threadSettings={threadSettings}
                query={query}
                onQueryChange={onQueryChange}
            />
        </div>
    )
}
