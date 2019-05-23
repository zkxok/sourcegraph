import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import React, { useCallback, useMemo, useState } from 'react'
import { map } from 'rxjs/operators'
import { ExtensionsControllerProps } from '../../../../shared/src/extensions/controller'
import { gql } from '../../../../shared/src/graphql/graphql'
import * as GQL from '../../../../shared/src/graphql/schema'
import { asError, createAggregateError, ErrorLike, isErrorLike } from '../../../../shared/src/util/errors'
import { pluralize } from '../../../../shared/src/util/strings'
import { queryGraphQL } from '../../backend/graphql'
import { OrgAreaPageProps } from '../../org/area/OrgArea'
import { LabelRow } from './LabelRow'
import { NewLabelForm } from './NewLabelForm'

const queryOrganizationOwnedLabels = (organization: GQL.ID): Promise<GQL.ILabelConnection> =>
    queryGraphQL(
        gql`
            query OrganizationOwnedLabels($organization: ID!) {
                node(id: $organization) {
                    __typename
                    ... on Org {
                        ownedLabels {
                            nodes {
                                id
                                name
                                description
                                color
                            }
                            totalCount
                        }
                    }
                }
            }
        `,
        { organization }
    )
        .pipe(
            map(({ data, errors }) => {
                if (
                    !data ||
                    !data.node ||
                    data.node.__typename !== 'Org' ||
                    !data.node.ownedLabels ||
                    (errors && errors.length > 0)
                ) {
                    throw createAggregateError(errors)
                }
                return data.node.ownedLabels
            })
        )
        .toPromise()

const LOADING: 'loading' = 'loading'

interface Props extends Pick<OrgAreaPageProps, 'org'>, ExtensionsControllerProps {}

/**
 * Lists an organization's labels.
 */
export const OrgLabelsPage: React.FunctionComponent<Props> = ({ org, ...props }) => {
    const [labelsOrError, setLabelsOrError] = useState<typeof LOADING | GQL.ILabelConnection | ErrorLike>(LOADING)
    const loadLabels = useCallback(async () => {
        setLabelsOrError(LOADING)
        try {
            setLabelsOrError(await queryOrganizationOwnedLabels(org.id))
        } catch (err) {
            setLabelsOrError(asError(err))
        }
    }, [org])
    // tslint:disable-next-line: no-floating-promises
    useMemo(loadLabels, [org])

    const [isShowingNewLabelForm, setIsShowingNewLabelForm] = useState(false)
    const toggleIsShowingNewLabelForm = useCallback(() => setIsShowingNewLabelForm(!isShowingNewLabelForm), [
        isShowingNewLabelForm,
    ])

    return (
        <div className="org-labels-page">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="mb-0">Labels</h2>
                <button type="button" className="btn btn-success" onClick={toggleIsShowingNewLabelForm}>
                    New label
                </button>
            </div>
            {isShowingNewLabelForm && (
                <NewLabelForm
                    org={org}
                    onDismiss={toggleIsShowingNewLabelForm}
                    onLabelCreate={loadLabels}
                    className="my-3 p-2 border rounded"
                />
            )}
            {labelsOrError === LOADING ? (
                <LoadingSpinner className="icon-inline mt-3" />
            ) : isErrorLike(labelsOrError) ? (
                <div className="alert alert-danger mt-3">{labelsOrError.message}</div>
            ) : (
                <div className="card">
                    <div className="card-header">
                        <span className="text-muted">
                            {labelsOrError.totalCount} {pluralize('label', labelsOrError.totalCount)}
                        </span>
                    </div>
                    {labelsOrError.nodes.length > 0 ? (
                        <ul className="list-group list-group-flush">
                            {labelsOrError.nodes.map(label => (
                                <li key={label.id} className="list-group-item p-2">
                                    <LabelRow {...props} label={label} onLabelUpdate={loadLabels} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-2 text-muted">No labels yet.</div>
                    )}
                </div>
            )}
        </div>
    )
}
