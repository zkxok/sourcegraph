import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import BackupRestoreIcon from 'mdi-react/BackupRestoreIcon'
import WindowCloseIcon from 'mdi-react/WindowCloseIcon'
import React, { useCallback, useState } from 'react'
import { NotificationType } from '../../../../../../shared/src/api/client/services/notifications'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { updateTargetInThread } from '../../../../discussions/backend'

interface Props {
    sourceItem: Pick<GQL.IDiscussionThreadTargetRepo, 'id' | 'isIgnored'>
    onSourceItemUpdate: (item: GQL.DiscussionThreadTarget) => void
    className?: string
    buttonClassName?: string
    extensionsController: {
        services: {
            notifications: {
                showMessages: Pick<
                    ExtensionsControllerProps<
                        'services'
                    >['extensionsController']['services']['notifications']['showMessages'],
                    'next'
                >
            }
        }
    }
}

/**
 * A button that changes the ignored status of a source item.
 */
export const SourceItemIgnoreButton: React.FunctionComponent<Props> = ({
    sourceItem,
    onSourceItemUpdate,
    className = '',
    buttonClassName = 'btn-secondary',
    extensionsController,
}) => {
    const [isLoading, setIsLoading] = useState(false)
    const onClick = useCallback<React.FormEventHandler>(
        async e => {
            e.preventDefault()
            setIsLoading(true)
            try {
                const updatedItem = await updateTargetInThread({
                    targetID: sourceItem.id,
                    isIgnored: !sourceItem.isIgnored,
                }).toPromise()
                onSourceItemUpdate(updatedItem)
            } catch (err) {
                extensionsController.services.notifications.showMessages.next({
                    message: `Error ${sourceItem.isIgnored ? 'un' : ''}ignoring item: ${err.message}`,
                    type: NotificationType.Error,
                })
            } finally {
                setIsLoading(false)
            }
        },
        [sourceItem.isIgnored, isLoading]
    )
    const Icon = sourceItem.isIgnored ? BackupRestoreIcon : WindowCloseIcon
    return (
        <button type="submit" disabled={isLoading} className={`btn ${buttonClassName} ${className}`} onClick={onClick}>
            {isLoading ? <LoadingSpinner className="icon-inline" /> : <Icon className="icon-inline" />}{' '}
            {sourceItem.isIgnored ? 'Unignore' : 'Ignore'}
        </button>
    )
}
