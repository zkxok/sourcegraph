import AlertCircleIcon from 'mdi-react/AlertCircleIcon'
import MapSearchIcon from 'mdi-react/MapSearchIcon'
import React, { useMemo, useState } from 'react'
import { Route, RouteComponentProps, Switch } from 'react-router'
import { map } from 'rxjs/operators'
import { Resizable } from '../../../../shared/src/components/Resizable'
import { ExtensionsControllerProps } from '../../../../shared/src/extensions/controller'
import { gql } from '../../../../shared/src/graphql/graphql'
import * as GQL from '../../../../shared/src/graphql/schema'
import { asError, createAggregateError, ErrorLike, isErrorLike } from '../../../../shared/src/util/errors'
import { queryGraphQL } from '../../backend/graphql'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { HeroPage } from '../../components/HeroPage'
import { ProjectLabelsPage } from './labels/ProjectLabelsPage'
import { ProjectAreaSidebar } from './sidebar/ProjectAreaSidebar'

const getProject = (idWithoutKind: GQL.IProjectOnQueryArguments['idWithoutKind']): Promise<GQL.IProject> =>
    queryGraphQL(
        gql`
            query Project($idWithoutKind: ID!) {
                project(idWithoutKind: $idWithoutKind) {
                    id
                    name
                    url
                }
            }
        `,
        { idWithoutKind }
    )
        .pipe(
            map(({ data, errors }) => {
                if (!data || !data.project || (errors && errors.length > 0)) {
                    throw createAggregateError(errors)
                }
                return data.project
            })
        )
        .toPromise()

const LOADING: 'loading' = 'loading'

const NotFoundPage = () => (
    <HeroPage icon={MapSearchIcon} title="404: Not Found" subtitle="Sorry, the requested page was not found." />
)

interface Props extends RouteComponentProps<{ idWithoutKind: string }>, ExtensionsControllerProps {}

export interface ProjectAreaContext extends ExtensionsControllerProps {
    /** The project. */
    project: GQL.IProject

    /** Called to update the project. */
    onProjectUpdate: (project: GQL.IProject) => void
}

/**
 * The area for a single project.
 */
export const ProjectArea: React.FunctionComponent<Props> = props => {
    const [projectOrError, setProjectOrError] = useState<typeof LOADING | GQL.IProject | ErrorLike>(LOADING)

    // tslint:disable-next-line: no-floating-promises beacuse fetchDiscussionProjectAndComments never throws
    useMemo(async () => {
        try {
            setProjectOrError(await getProject(props.match.params.idWithoutKind))
        } catch (err) {
            setProjectOrError(asError(err))
        }
    }, [props.match.params.idWithoutKind])

    if (projectOrError === LOADING) {
        return null // loading
    }
    if (isErrorLike(projectOrError)) {
        return <HeroPage icon={AlertCircleIcon} title="Error" subtitle={projectOrError.message} />
    }

    const context: ProjectAreaContext & {
        areaURL: string
    } = {
        ...props,
        project: projectOrError,
        onProjectUpdate: setProjectOrError,
        areaURL: props.match.url,
    }

    return (
        <div className="project-area border-top flex-1 d-flex flex-row-reverse overflow-hidden">
            <Resizable
                className="project-area__sidebar-resizable border-right"
                handlePosition="right"
                storageKey="project-area__sidebar-resizable"
                defaultSize={216 /* px */}
                element={
                    <ProjectAreaSidebar
                        {...context}
                        className="project-area__sidebar flex-1 overflow-auto"
                        history={props.history}
                    />
                }
            />
            <div className="flex-1 overflow-auto">
                <ErrorBoundary location={props.location}>
                    <Switch>
                        <Route
                            path={props.match.url}
                            key="hardcoded-key" // see https://github.com/ReactTraining/react-router/issues/4578#issuecomment-334489490
                            exact={true}
                            // tslint:disable-next-line:jsx-no-lambda
                            render={() => <p>Overview!</p>}
                        />
                        <Route
                            path={`${props.match.url}/labels`}
                            key="hardcoded-key" // see https://github.com/ReactTraining/react-router/issues/4578#issuecomment-334489490
                            exact={true}
                            // tslint:disable-next-line:jsx-no-lambda
                            render={routeComponentProps => <ProjectLabelsPage {...context} {...routeComponentProps} />}
                        />
                        <Route key="hardcoded-key" component={NotFoundPage} />
                    </Switch>
                </ErrorBoundary>
            </div>
        </div>
    )
}
