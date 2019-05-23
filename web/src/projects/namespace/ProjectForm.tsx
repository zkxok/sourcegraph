import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import ReloadIcon from 'mdi-react/ReloadIcon'
import randomColor from 'randomcolor'
import React, { useCallback, useEffect, useState } from 'react'
import * as GQL from '../../../../shared/src/graphql/schema'
import { Form } from '../../components/Form'
import { Project } from '../../components/Project'

const getRandomColor = () => randomColor() as string

export interface ProjectFormData extends Pick<GQL.IProject, 'name' | 'description' | 'color'> {}

interface Props {
    initialValue?: ProjectFormData

    /** Called when the form is dismissed with no action taken. */
    onDismiss: () => void

    /** Called when the form is submitted. */
    onSubmit: (project: ProjectFormData) => void

    buttonText: string
    isLoading: boolean

    className?: string
}

/**
 * A form to create or edit a project.
 */
export const ProjectForm: React.FunctionComponent<Props> = ({
    initialValue = { name: '', description: '', color: '' },
    onDismiss,
    onSubmit: onSubmitProject,
    buttonText,
    isLoading,
    className = '',
}) => {
    const [name, setName] = useState(initialValue.name)
    const onNameChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
        e => setName(e.currentTarget.value),
        []
    )
    useEffect(() => setName(initialValue.name), [initialValue.color])

    const [description, setDescription] = useState(initialValue.description)
    const onDescriptionChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
        e => setDescription(e.currentTarget.value),
        []
    )
    useEffect(() => setDescription(initialValue.description), [initialValue.description])

    const [color, setColor] = useState(initialValue.color || getRandomColor())
    const onColorChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
        e => setColor(e.currentTarget.value),
        []
    )
    const onRandomColorClick = useCallback(() => setColor(getRandomColor()), [])
    useEffect(() => setColor(initialValue.color || getRandomColor()), [initialValue.color])

    const onSubmit = useCallback<React.FormEventHandler>(
        async e => {
            e.preventDefault()
            onSubmitProject({ name, color, description })
        },
        [name, color, description]
    )

    return (
        <Form className={`form ${className}`} onSubmit={onSubmit}>
            <Project project={{ name: name || 'Project preview', color }} className="h5 mb-2" />
            <div className="form-row align-items-end">
                <div className="form-group mb-md-0 col-md-3">
                    <project htmlFor="new-project-form__name">Name</project>
                    <input
                        type="text"
                        id="new-project-form__name"
                        className="form-control"
                        required={true}
                        minLength={1}
                        placeholder="Project name"
                        value={name}
                        onChange={onNameChange}
                        autoFocus={true}
                    />
                </div>
                <div className="form-group mb-md-0 col-md-4">
                    <project htmlFor="new-project-form__description">Description</project>
                    <input
                        type="text"
                        id="new-project-form__description"
                        className="form-control"
                        placeholder="Optional description"
                        value={description || ''}
                        onChange={onDescriptionChange}
                    />
                </div>
                <div className="form-group mb-md-0 col-md-2">
                    <project htmlFor="new-project-form__color">Color</project>
                    <div className="d-flex">
                        <Project
                            project={{ name: '', color }}
                            onClick={onRandomColorClick}
                            className="btn mr-2 d-flex px-2"
                        >
                            <ReloadIcon className="icon-inline" />
                        </Project>
                        <input
                            type="text"
                            id="new-project-form__color"
                            className="form-control"
                            placeholder="Color"
                            required={true}
                            size={7}
                            maxLength={7}
                            value={color}
                            onChange={onColorChange}
                        />
                    </div>
                </div>
                <div className="form-group mb-md-0 col-md-3 text-right">
                    <button type="reset" className="btn btn-secondary mr-2" onClick={onDismiss}>
                        Cancel
                    </button>
                    <button type="submit" disabled={isLoading} className="btn btn-success">
                        {isLoading ? <LoadingSpinner className="icon-inline" /> : buttonText}
                    </button>
                </div>
            </div>
        </Form>
    )
}
