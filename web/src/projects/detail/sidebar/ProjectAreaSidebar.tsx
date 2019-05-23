import CircleIcon from 'mdi-react/CircleIcon'
import FolderTextIcon from 'mdi-react/FolderTextIcon'
import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ExtensionsControllerProps } from '../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../shared/src/graphql/schema'
import { CollapsibleSidebar } from '../../../components/collapsibleSidebar/CollapsibleSidebar'
import { ChecksIcon } from '../../../enterprise/checks/icons'
import { ThreadsIcon } from '../../../enterprise/threads/icons'
import { NavItemWithIconDescriptor } from '../../../util/contributions'
import { LabelIcon, ProjectIcon } from '../../icons'

interface Props extends ExtensionsControllerProps {
    project: GQL.IProject
    areaURL: string
    className?: string
}

const LINKS: NavItemWithIconDescriptor[] = [
    { to: '', label: 'Project', icon: ProjectIcon, exact: true },
    { to: '/tree', label: 'Repository', icon: FolderTextIcon },
    { to: '/checks', label: 'Checks', icon: ChecksIcon },
    { to: '/threads', label: 'Threads', icon: ThreadsIcon },
    { to: '/labels', label: 'Labels', icon: LabelIcon },
]

/**
 * The sidebar for the project area (for a single project).
 */
export const ProjectAreaSidebar: React.FunctionComponent<Props> = ({ project, areaURL, className = '', ...props }) => (
    <CollapsibleSidebar
        localStorageKey="project-area__sidebar"
        side="left"
        className={`project-area-sidebar d-flex flex-column ${className}`}
        collapsedClassName="project-area-sidebar--collapsed"
        expandedClassName="project-area-sidebar--expanded"
    >
        {expanded => (
            <>
                <h3>
                    <Link to={areaURL} className="px-2 pt-3 pb-2 d-block text-decoration-none shadow-none text-body">
                        {expanded ? project.name : <CircleIcon />}
                    </Link>
                </h3>
                <ul className="list-group list-group-flush">
                    {LINKS.map(({ to, label, icon: Icon, exact }, i) => (
                        <li key={i} className="nav-item">
                            <NavLink
                                to={areaURL + to}
                                exact={exact}
                                className="project-area-sidebar__nav-link nav-link p-3 text-nowrap"
                                activeClassName="project-area-sidebar__nav-link--active text-body"
                                data-tooltip={expanded ? '' : label}
                            >
                                {Icon && <Icon className="icon-inline mr-1" />} {expanded && label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </>
        )}
    </CollapsibleSidebar>
)
