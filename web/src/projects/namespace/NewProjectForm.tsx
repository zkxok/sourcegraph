import React, { useCallback, useState } from 'react'
import { map } from 'rxjs/operators'
import { gql } from '../../../../shared/src/graphql/graphql'
import * as GQL from '../../../../shared/src/graphql/schema'
import { createAggregateError } from '../../../../shared/src/util/errors'
import { mutateGraphQL } from '../../backend/graphql'
import { ProjectForm, ProjectFormData } from './ProjectForm'

const createProject = (input: GQL.ICreateProjectInput): Promise<void> =>
    mutateGraphQL(
        gql`
            mutation CreateProject($input: CreateProjectInput!) {
                projects {
                    createProject(input: $input) {
                        id
                    }
                }
            }
        `,
        { input }
    )
        .pipe(
            map(({ data, errors }) => {
                if (!data || !data.projects || !data.projects.createProject || (errors && errors.length > 0)) {
                    throw createAggregateError(errors)
                }
            })
        )
        .toPromise()

interface Props {
    project: Pick<GQL.IProject, 'id'>

    /** Called when the form is dismissed. */
    onDismiss: () => void

    /** Called after the project is created successfully. */
    onProjectCreate: () => void

    className?: string
}

/**
 * A form to create a new project.
 */
export const NewProjectForm: React.FunctionComponent<Props> = ({ project, onDismiss, onProjectCreate, className = '' }) => {
    const [isLoading, setIsLoading] = useState(false)
    const onSubmit = useCallback(
        async ({ name, color, description }: ProjectFormData) => {
            setIsLoading(true)
            try {
                await createProject({ name, color, description, project: project.id })
                setIsLoading(false)
                onDismiss()
                onProjectCreate()
            } catch (err) {
                setIsLoading(false)
                alert(err.message) // TODO!(sqs)
            }
        },
        [org]
    )

    return (
        <ProjectForm
            onDismiss={onDismiss}
            onSubmit={onSubmit}
            buttonText="Create project"
            isLoading={isLoading}
            className={className}
        />
    )
}
