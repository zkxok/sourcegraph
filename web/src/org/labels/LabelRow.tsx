import PencilIcon from 'mdi-react/PencilIcon'
import React, { useCallback, useState } from 'react'
import { ExtensionsControllerProps } from '../../../../shared/src/extensions/controller'
import * as GQL from '../../../../shared/src/graphql/schema'
import { Label } from '../../components/Label'
import { UpdateLabelForm } from './EditLabelForm'
import { LabelDeleteButton } from './LabelDeleteButton'

interface Props extends ExtensionsControllerProps {
    label: GQL.ILabel

    /** Called when the label is updated. */
    onLabelUpdate: () => void
}

/**
 * A row in the list of labels.
 */
export const LabelRow: React.FunctionComponent<Props> = ({ label, onLabelUpdate, ...props }) => {
    const [isEditing, setIsEditing] = useState(false)
    const toggleIsEditing = useCallback(() => setIsEditing(!isEditing), [isEditing])

    return isEditing ? (
        <UpdateLabelForm label={label} onLabelUpdate={onLabelUpdate} onDismiss={toggleIsEditing} />
    ) : (
        <div className="row">
            <div className="col-md-4">
                <Label label={label} className="h5 mb-0" />
            </div>
            <div className="col-md-5">{label.description}</div>
            <div className="col-md-3 text-right">
                <button type="button" className="btn btn-link text-decoration-none" onClick={toggleIsEditing}>
                    <PencilIcon className="icon-inline" /> Edit
                </button>
                <LabelDeleteButton {...props} label={label} onDelete={onLabelUpdate} />
            </div>
        </div>
    )
}
