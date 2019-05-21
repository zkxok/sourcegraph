import H from 'history'
import PencilIcon from 'mdi-react/PencilIcon'
import React, { useState } from 'react'
import { ChatIcon } from '../../../../../../shared/src/components/icons'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { DiscussionsCreate } from '../../../../repo/blob/discussions/DiscussionsCreate'
import { SourceItemIgnoreButton } from './SourceItemIgnoreButton'

interface Props extends ExtensionsControllerProps {
    sourceItem: GQL.IDiscussionThreadTargetRepo
    onSourceItemUpdate: (item: GQL.DiscussionThreadTarget) => void
    className?: string
    history: H.History
    location: H.Location
}

/**
 * The actions that can be performed on a source item.
 */
// tslint:disable: jsx-no-lambda
export const SourceItemActions: React.FunctionComponent<Props> = ({
    sourceItem,
    onSourceItemUpdate,
    className,
    history,
    location,
    extensionsController,
}) => {
    const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false)

    return (
        <div className={className}>
            {isCreatingDiscussion ? (
                <DiscussionsCreate
                    repoID={'123'}
                    repoName={'repo'}
                    commitID="master" // TODO!(sqs)
                    rev="master"
                    filePath="abc"
                    className="border-top"
                    onDiscard={() => setIsCreatingDiscussion(false)}
                    extensionsController={extensionsController}
                    history={history}
                    location={location}
                />
            ) : (
                <>
                    <button onClick={() => setIsCreatingDiscussion(true)} className="btn btn-link text-decoration-none">
                        <ChatIcon className="icon-inline" /> Add comment
                    </button>
                    <button onClick={() => alert('not implemented')} className="btn btn-link text-decoration-none">
                        <PencilIcon className="icon-inline" /> Edit
                    </button>
                    <SourceItemIgnoreButton
                        sourceItem={sourceItem}
                        onSourceItemUpdate={onSourceItemUpdate}
                        className="text-decoration-none"
                        buttonClassName="btn-link"
                        extensionsController={extensionsController}
                    />
                </>
            )}
        </div>
    )
}
