import SourcePullIcon from 'mdi-react/SourcePullIcon'
import React, { useCallback, useState } from 'react'
import { ButtonDropdown, DropdownToggle } from 'reactstrap'
import { NotificationType } from '../../../../../../../../shared/src/api/client/services/notifications'
import { ExtensionsControllerProps } from '../../../../../../../../shared/src/extensions/controller'
import { PullRequest } from '../../../activity/ThreadStatusItemsList'
import { PullRequestDropdownMenu } from './PullRequestDropdownMenu'

interface Props {
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
 * An action on a thread inbox item to add the item to an existing or new pull request.
 */
export const ThreadInboxItemAddToPullRequest: React.FunctionComponent<Props> = ({
    buttonClassName = 'btn-secondary',
    extensionsController,
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const toggleIsOpen = useCallback(() => setIsOpen(!isOpen), [isOpen])

    const onAddToExistingPullRequestClick = useCallback(
        async (_pull: PullRequest) => {
            try {
                // TODO!(sqs): do something
            } catch (err) {
                extensionsController.services.notifications.showMessages.next({
                    message: `Error attaching to existing pull request: ${err.message}`,
                    type: NotificationType.Error,
                })
            }
        },
        [isOpen]
    )

    return (
        <ButtonDropdown isOpen={isOpen} toggle={toggleIsOpen}>
            <DropdownToggle className={`btn ${buttonClassName}`} color="none">
                <SourcePullIcon className="icon-inline" /> Add to pull request
            </DropdownToggle>
            <PullRequestDropdownMenu onAddToExistingThreadClick={onAddToExistingPullRequestClick} right={true} />
        </ButtonDropdown>
    )
}
