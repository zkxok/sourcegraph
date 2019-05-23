import PencilIcon from 'mdi-react/PencilIcon'
import React, { useCallback, useState } from 'react'
import { ExtensionsControllerProps } from '../../../../shared/src/extensions/controller'
import * as GQL from '../../../../shared/src/graphql/schema'
import { ProjectIcon } from '../../projects/icons'
import { UpdateProjectForm } from './EditProjectForm'
import { ProjectDeleteButton } from './ProjectDeleteButton'

interface Props extends ExtensionsControllerProps {
    project: GQL.IProject

    /** Called when the project is updated. */
    onProjectUpdate: () => void
}

/**
 * A row in the list of projects.
 */
export const ProjectRow: React.FunctionComponent<Props> = ({ project, onProjectUpdate, ...props }) => {
    const [isEditing, setIsEditing] = useState(false)
    const toggleIsEditing = useCallback(() => setIsEditing(!isEditing), [isEditing])

    return isEditing ? (
        <UpdateProjectForm project={project} onProjectUpdate={onProjectUpdate} onDismiss={toggleIsEditing} />
    ) : (
        <div className="d-flex justify-content-between">
            <div>
                <ProjectIcon className="icon-inline" /> {project.name}
            </div>
            <div className="text-right">
                <button type="button" className="btn btn-link text-decoration-none" onClick={toggleIsEditing}>
                    <PencilIcon className="icon-inline" /> Edit
                </button>
                <ProjectDeleteButton {...props} project={project} onDelete={onProjectUpdate} />
            </div>
        </div>
    )
}
