import H from 'history'
import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ExtensionsControllerProps } from '../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../shared/src/graphql/schema'
import { LabelIcon, ProjectIcon } from '../../icons'

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
            <Link to={project.url} className="px-2 pt-3 pb-2 d-block text-decoration-none shadow-none">
                {project.name}
            </Link>
        </h3>
        <ul className="list-group list-group-flush">
            <li className="nav-item">
                <NavLink
                    to={project.url}
                    exact={true}
                    className="project-area-sidebar__nav-link nav-link py-3"
                    activeClassName="project-area-sidebar__nav-link--active text-body"
                >
                    <ProjectIcon className="icon-inline mr-1" /> Project
                </NavLink>
            </li>
            <li className="nav-item">
                <NavLink
                    to={`${project.url}/labels`}
                    className="project-area-sidebar__nav-link nav-link py-3"
                    activeClassName="project-area-sidebar__nav-link--active text-body"
                >
                    <LabelIcon className="icon-inline mr-1" /> Labels
                </NavLink>
            </li>
        </ul>
    </div>
)
