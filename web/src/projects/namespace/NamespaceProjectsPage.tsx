import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import React, { useCallback, useMemo, useState } from 'react'
import { map } from 'rxjs/operators'
import { gql } from '../../../../shared/src/graphql/graphql'
import * as GQL from '../../../../shared/src/graphql/schema'
import { asError, createAggregateError, ErrorLike, isErrorLike } from '../../../../shared/src/util/errors'
import { pluralize } from '../../../../shared/src/util/strings'
import { queryGraphQL } from '../../backend/graphql'
import { ProjectRow } from './ProjectRow'
import { NewProjectForm } from './NewProjectForm'
import { ExtensionsControllerProps } from '../../../../shared/src/extensions/controller'

const queryNamespaceProjects = (namespace: GQL.ID): Promise<GQL.IProjectConnection> =>
    queryGraphQL(
        gql`
            query NamespaceProjects($namespace: ID!) {
                namespace(id: $namespace) {
                    projects {
                        nodes {
                            id
                            name
                        }
                        totalCount
                    }
                }
            }
        `,
        { namespace }
    )
        .pipe(
            map(({ data, errors }) => {
                if (!data || !data.namespace || !data.namespace.projects || (errors && errors.length > 0)) {
                    throw createAggregateError(errors)
                }
                return data.namespace.projects
            })
        )
        .toPromise()

const LOADING: 'loading' = 'loading'

interface Props extends Pick<OrgAreaPageProps, 'org'>, ExtensionsControllerProps {}

/**
 * Lists a namespace's projects.
 */
export const NamespaceProjectsPage: React.FunctionComponent<Props> = ({ org, ...props }) => {
    const [projectsOrError, setProjectsOrError] = useState<typeof LOADING | GQL.IProjectConnection | ErrorLike>(LOADING)
    const loadProjects = useCallback(async () => {
        setProjectsOrError(LOADING)
        try {
            setProjectsOrError(await queryNamespaceProjects(org.id))
        } catch (err) {
            setProjectsOrError(asError(err))
        }
    }, [org])
    // tslint:disable-next-line: no-floating-promises
    useMemo(loadProjects, [org])

    const [isShowingNewProjectForm, setIsShowingNewProjectForm] = useState(false)
    const toggleIsShowingNewProjectForm = useCallback(() => setIsShowingNewProjectForm(!isShowingNewProjectForm), [
        isShowingNewProjectForm,
    ])

    return (
        <div className="org-projects-page">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="mb-0">Projects</h2>
                <button type="button" className="btn btn-success" onClick={toggleIsShowingNewProjectForm}>
                    New project
                </button>
            </div>
            {isShowingNewProjectForm && (
                <NewProjectForm
                    org={org}
                    onDismiss={toggleIsShowingNewProjectForm}
                    onProjectCreate={loadProjects}
                    className="my-3 p-2 border rounded"
                />
            )}
            {projectsOrError === LOADING ? (
                <LoadingSpinner className="icon-inline mt-3" />
            ) : isErrorLike(projectsOrError) ? (
                <div className="alert alert-danger mt-3">{projectsOrError.message}</div>
            ) : (
                <div className="card">
                    <div className="card-header">
                        <span className="text-muted">
                            {projectsOrError.totalCount} {pluralize('project', projectsOrError.totalCount)}
                        </span>
                    </div>
                    {projectsOrError.nodes.length > 0 ? (
                        <ul className="list-group list-group-flush">
                            {projectsOrError.nodes.map(project => (
                                <li key={project.id} className="list-group-item p-2">
                                    <ProjectRow {...props} project={project} onProjectUpdate={loadProjects} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-2 text-muted">No projects yet.</div>
                    )}
                </div>
            )}
        </div>
    )
}
