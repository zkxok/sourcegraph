import H from 'history'
import React from 'react'
import { Link } from 'react-router-dom'
import { ExtensionsControllerProps } from '../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../shared/src/graphql/schema'

interface Props extends ExtensionsControllerProps {
    project: GQL.IProject
    onProjectUpdate: (project: GQL.IProject) => void
    areaURL: string
    className?: string
    history: H.History
}

/**
 * The sidebar for the project area (for a single project).
 */
export const ProjectAreaSidebar: React.FunctionComponent<Props> = ({ project, className = '', ...props }) => (
    <div className={`project-area-sidebar d-flex flex-column ${className}`}>
        <h3>
            <Link to={project.url}>{project.name}</Link>
        </h3>
        <div className="list-group list-group-flush">
            <Link to={project.url} className="list-group-item-action">
                Project
            </Link>
            <Link to={`${project.url}/labels`} className="list-group-item-action">
                Labels
            </Link>
        </div>
    </div>
)
