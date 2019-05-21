import H from 'history'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckTemplate } from '../../../../../../shared/src/api/client/services/checkTemplates'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import { PageTitle } from '../../../../components/PageTitle'
import { CheckTemplateItem } from '../../components/CheckTemplateItem'
import { CheckThreadTemplateSelectFormControl } from './CheckThreadTemplateSelectFormControl'
import { NewCheckThreadForm } from './NewCheckThreadForm'

interface Props extends ExtensionsControllerProps<'services'> {
    history: H.History
    location: H.Location
}

const urlForCheckTemplate = (checkTemplateId: string | null): H.LocationDescriptor => {
    const params = checkTemplateId !== null ? new URLSearchParams({ template: checkTemplateId }) : ''
    return `/checks/new?${params}`
}

/**
 * A page for adding a new check based on one of the registered check templates.
 */
export const NewCheckThreadPage: React.FunctionComponent<Props> = ({ history, location, extensionsController }) => {
    const checkTemplateId = new URLSearchParams(location.search).get('template')
    const [checkTemplate, setCheckTemplate] = useState<CheckTemplate>()
    useEffect(() => {
        if (checkTemplateId === null) {
            setCheckTemplate(undefined)
            return undefined
        }
        const subscription = extensionsController.services.checkTemplates
            .getCheckTemplate(checkTemplateId)
            .subscribe(checkTemplate => setCheckTemplate(checkTemplate || undefined))
        return () => subscription.unsubscribe()
    }, [checkTemplateId])

    return (
        <div className="new-check-thread-page container mt-4">
            <PageTitle title="New check" />
            <h1 className="mb-3">New check</h1>
            <div className="row">
                <div className="col-md-9 col-lg-8 col-xl-7">
                    <label>Type</label>
                    {!checkTemplate ? (
                        <CheckThreadTemplateSelectFormControl
                            urlForCheckTemplate={urlForCheckTemplate}
                            extensionsController={extensionsController}
                        />
                    ) : (
                        <>
                            <CheckTemplateItem
                                checkTemplate={checkTemplate}
                                className="border rounded"
                                endFragment={
                                    <Link
                                        to={urlForCheckTemplate(null)}
                                        className="btn btn-secondary text-decoration-none"
                                        data-tooltip="Choose a different template"
                                    >
                                        Change
                                    </Link>
                                }
                            />
                            <NewCheckThreadForm checkTemplate={checkTemplate} className="mt-3" history={history} />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
