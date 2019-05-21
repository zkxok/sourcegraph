import H from 'history'
import MapSearchIcon from 'mdi-react/MapSearchIcon'
import React from 'react'
import { Route, RouteComponentProps, Switch } from 'react-router'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { ErrorBoundary } from '../../../../components/ErrorBoundary'
import { HeroPage } from '../../../../components/HeroPage'
import { ThreadSettings } from '../../settings'
import { ThreadAreaContext } from '../ThreadArea'
import { ThreadActionsPullRequests } from './pullRequests/ThreadActionsPullRequests'
import { ThreadActionsAreaSidebar } from './ThreadActionsAreaSidebar'
import { ThreadActionsOverview } from './ThreadActionsOverview'

const NotFoundPage = () => (
    <HeroPage icon={MapSearchIcon} title="404: Not Found" subtitle="Sorry, the requested page was not found." />
)

interface Props extends RouteComponentProps<{}> {
    thread: GQL.IDiscussionThread
    onThreadUpdate: (thread: GQL.IDiscussionThread) => void
    threadSettings: ThreadSettings

    history: H.History
    location: H.Location
}

/**
 * The actions area for a single thread.
 */
export const ThreadActionsArea: React.FunctionComponent<Props> = ({
    thread,
    onThreadUpdate,
    threadSettings,
    ...props
}) => {
    const context: ThreadAreaContext & { areaURL: string } = {
        thread,
        onThreadUpdate,
        threadSettings,
        areaURL: props.match.url,
    }

    return (
        <div className="thread-actions-area container d-flex">
            <ThreadActionsAreaSidebar {...context} className="flex-0 mr-2" />
            <div className="flex-1">
                <ErrorBoundary location={props.location}>
                    <Switch>
                        <Route
                            path={props.match.url}
                            key="hardcoded-key" // see https://github.com/ReactTraining/react-router/issues/4578#issuecomment-334489490
                            exact={true}
                            // tslint:disable-next-line:jsx-no-lambda
                            render={_routeComponentProps => <ThreadActionsOverview />}
                        />
                        <Route
                            path={`${props.match.url}/pull-requests`}
                            key="hardcoded-key" // see https://github.com/ReactTraining/react-router/issues/4578#issuecomment-334489490
                            exact={true}
                            // tslint:disable-next-line:jsx-no-lambda
                            render={routeComponentProps => (
                                <ThreadActionsPullRequests {...routeComponentProps} {...context} />
                            )}
                        />
                        <Route key="hardcoded-key" component={NotFoundPage} />
                    </Switch>
                </ErrorBoundary>
            </div>
        </div>
    )
}
