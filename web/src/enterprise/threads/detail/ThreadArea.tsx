import AlertCircleIcon from 'mdi-react/AlertCircleIcon'
import MapSearchIcon from 'mdi-react/MapSearchIcon'
import React, { useMemo, useState } from 'react'
import { Route, RouteComponentProps, Switch } from 'react-router'
import * as GQL from '../../../../../shared/src/graphql/schema'
import { asError, ErrorLike, isErrorLike } from '../../../../../shared/src/util/errors'
import { ErrorBoundary } from '../../../components/ErrorBoundary'
import { HeroPage } from '../../../components/HeroPage'
import { fetchDiscussionThreadAndComments } from '../../../discussions/backend'
import { parseJSON } from '../../../settings/configuration'
import { ThreadsAreaContext } from '../global/ThreadsArea'
import { ThreadSettings } from '../settings'
import { ThreadActionsArea } from './actions/ThreadActionsArea'
import { ThreadDiscussionPage } from './discussion/ThreadDiscussionPage'
import { ThreadInboxPage } from './inbox/ThreadInboxPage'
import { ThreadOverview } from './overview/ThreadOverview'
import { ThreadSettingsPage } from './settings/ThreadSettingsPage'
import { ThreadAreaSidebar } from './sidebar/ThreadAreaSidebar'
import { ThreadAreaNavbar } from './ThreadAreaNavbar'

const NotFoundPage = () => (
    <HeroPage icon={MapSearchIcon} title="404: Not Found" subtitle="Sorry, the requested page was not found." />
)

interface Props extends ThreadsAreaContext, RouteComponentProps<{ threadID: string }> {}

export interface ThreadAreaContext {
    /** The thread. */
    thread: GQL.IDiscussionThread

    /** Called to update the thread. */
    onThreadUpdate: (thread: GQL.IDiscussionThread) => void

    /** The thread's parsed JSON settings. */
    threadSettings: ThreadSettings
}

const LOADING: 'loading' = 'loading'

/**
 * The area for a single thread.
 */
export const ThreadArea: React.FunctionComponent<Props> = props => {
    const [threadOrError, setThreadOrError] = useState<typeof LOADING | GQL.IDiscussionThread | ErrorLike>(LOADING)

    // tslint:disable-next-line: no-floating-promises beacuse fetchDiscussionThreadAndComments never throws
    useMemo(async () => {
        try {
            setThreadOrError(await fetchDiscussionThreadAndComments(props.match.params.threadID).toPromise())
        } catch (err) {
            setThreadOrError(asError(err))
        }
    }, [props.match.params.threadID])

    if (threadOrError === LOADING) {
        return null // loading
    }
    if (isErrorLike(threadOrError)) {
        return <HeroPage icon={AlertCircleIcon} title="Error" subtitle={threadOrError.message} />
    }

    const context: ThreadsAreaContext &
        ThreadAreaContext & {
            threadSettings: ThreadSettings
            areaURL: string
        } = {
        ...props,
        thread: threadOrError,
        onThreadUpdate: setThreadOrError,
        threadSettings: parseJSON(threadOrError.settings),
        areaURL: props.match.url,
    }

    const isCheck = threadOrError && !isErrorLike(threadOrError) && threadOrError.type === GQL.ThreadType.CHECK
    const sections = {
        review: true,
        actions: isCheck,
        settings: isCheck,
    }

    return (
        <div className="thread-area border-top flex-1 d-flex overflow-hidden">
            <div className="flex-1 overflow-auto">
                <ErrorBoundary location={props.location}>
                    <ThreadOverview {...context} location={props.location} history={props.history} />
                    {(sections.review || sections.actions || sections.settings) && (
                        <ThreadAreaNavbar {...context} sections={sections} className="my-3" />
                    )}
                </ErrorBoundary>
                <ErrorBoundary location={props.location}>
                    <Switch>
                        <Route
                            path={props.match.url}
                            key="hardcoded-key" // see https://github.com/ReactTraining/react-router/issues/4578#issuecomment-334489490
                            exact={true}
                            // tslint:disable-next-line:jsx-no-lambda
                            render={routeComponentProps => (
                                <ThreadDiscussionPage {...context} {...routeComponentProps} />
                            )}
                        />
                        {sections.review && (
                            <Route
                                path={`${props.match.url}/inbox`}
                                key="hardcoded-key" // see https://github.com/ReactTraining/react-router/issues/4578#issuecomment-334489490
                                exact={true}
                                // tslint:disable-next-line:jsx-no-lambda
                                render={routeComponentProps => (
                                    <ThreadInboxPage {...context} {...routeComponentProps} />
                                )}
                            />
                        )}
                        {sections.actions && (
                            <Route
                                path={`${props.match.url}/actions`}
                                key="hardcoded-key" // see https://github.com/ReactTraining/react-router/issues/4578#issuecomment-334489490
                                // tslint:disable-next-line:jsx-no-lambda
                                render={routeComponentProps => (
                                    <ThreadActionsArea {...context} {...routeComponentProps} />
                                )}
                            />
                        )}
                        {sections.settings && (
                            <Route
                                path={`${props.match.url}/settings`}
                                key="hardcoded-key" // see https://github.com/ReactTraining/react-router/issues/4578#issuecomment-334489490
                                exact={true}
                                // tslint:disable-next-line:jsx-no-lambda
                                render={routeComponentProps => (
                                    <ThreadSettingsPage {...context} {...routeComponentProps} />
                                )}
                            />
                        )}
                        <Route key="hardcoded-key" component={NotFoundPage} />
                    </Switch>
                </ErrorBoundary>
            </div>
            <ThreadAreaSidebar {...context} className="thread-area__sidebar flex-0" history={props.history} />
        </div>
    )
}
