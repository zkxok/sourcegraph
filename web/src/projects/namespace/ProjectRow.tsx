import PencilIcon from 'mdi-react/PencilIcon'
import React, { useCallback, useState } from 'react'
import { ExtensionsControllerProps } from '../../../../shared/src/extensions/controller'
import * as GQL from '../../../../shared/src/graphql/schema'
import { Project } from '../../components/Project'
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
        <div className="row">
            <div className="col-md-4">
                <Project project={project} className="h5 mb-0" />
            </div>
            <div className="col-md-5">{project.description}</div>
            <div className="col-md-3 text-right">
                <button type="button" className="btn btn-link text-decoration-none" onClick={toggleIsEditing}>
                    <PencilIcon className="icon-inline" /> Edit
                </button>
                <ProjectDeleteButton {...props} project={project} onDelete={onProjectUpdate} />
            </div>
        </div>
    )
}
