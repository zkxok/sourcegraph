import classNames from 'classnames'
import H from 'history'
import { upperFirst } from 'lodash'
import AlertCircleOutlineIcon from 'mdi-react/AlertCircleOutlineIcon'
import CancelIcon from 'mdi-react/CancelIcon'
import React from 'react'
import { CodeExcerpt } from '../../../../../../shared/src/components/CodeExcerpt'
import { LinkOrSpan } from '../../../../../../shared/src/components/LinkOrSpan'
import { displayRepoName } from '../../../../../../shared/src/components/RepoFileLink'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { fetchHighlightedFileLines } from '../../../../repo/backend'
import { ThreadSettings } from '../../settings'
import { ThreadInboxItemActions } from './ThreadInboxItemActions'

interface Props extends ExtensionsControllerProps {
    thread: Pick<GQL.IDiscussionThread, 'id' | 'idWithoutKind' | 'settings'>
    onThreadUpdate: (thread: GQL.IDiscussionThread) => void
    threadSettings: ThreadSettings
    inboxItem: GQL.IDiscussionThreadTargetRepo
    onInboxItemUpdate: (item: GQL.DiscussionThreadTarget) => void
    className?: string
    isLightTheme: boolean
    history: H.History
    location: H.Location
}

const statusIcon = (
    item: Pick<GQL.IDiscussionThreadTargetRepo, 'isIgnored'>
): React.ComponentType<{ className?: string }> => {
    if (item.isIgnored) {
        return CancelIcon
    }
    return AlertCircleOutlineIcon
}

/**
 * An inbox item in a thread that refers to a text document location.
 */
export const TextDocumentLocationInboxItem: React.FunctionComponent<Props> = ({
    inboxItem,
    onInboxItemUpdate,
    className = '',
    isLightTheme,
    ...props
}) => {
    const Icon = statusIcon(inboxItem)
    return (
        <div className={`card border ${className}`}>
            <div className="card-header d-flex align-items-center">
                <Icon
                    className={classNames('icon-inline', 'mr-2', 'h5', 'mb-0', {
                        'text-success': !inboxItem.isIgnored,
                        'text-muted': inboxItem.isIgnored,
                    })}
                    data-tooltip={upperFirst(status)}
                />
                <div className="flex-1">
                    <h3 className="d-flex align-items-center mb-0 h6">
                        <LinkOrSpan to={inboxItem.url} className="text-body">
                            {inboxItem.path ? (
                                <>
                                    <span className="font-weight-normal">
                                        {displayRepoName(inboxItem.repository.name)}
                                    </span>{' '}
                                    › {inboxItem.path}
                                </>
                            ) : (
                                displayRepoName(inboxItem.repository.name)
                            )}
                        </LinkOrSpan>
                    </h3>
                    {/* TODO!(sqs) <small className="text-muted">
                        Changed {formatDistance(Date.parse(item.updatedAt), Date.now())} ago by{' '}
                        <strong>{item.updatedBy}</strong>
                            </small> */}
                </div>
                {/* TODO!(sqs)<div>
                    {item.commentsCount > 0 && (
                        <ul className="list-inline d-flex align-items-center">
                            <li className="list-inline-item">
                                <small className="text-muted">
                                    <MessageOutlineIcon className="icon-inline" /> {item.commentsCount}
                                </small>
                            </li>
                        </ul>
                    )}
                    </div>*/}
            </div>
            {inboxItem.path && (
                <CodeExcerpt
                    repoName={inboxItem.repository.name}
                    commitID="master" // TODO!(sqs)
                    filePath={inboxItem.path}
                    context={3}
                    highlightRanges={
                        inboxItem.selection
                            ? [
                                  {
                                      line: inboxItem.selection.startLine,
                                      character: inboxItem.selection.startCharacter,
                                      highlightLength:
                                          inboxItem.selection.endCharacter - inboxItem.selection.startCharacter || 10, // TODO!(sqs): hack to avoid having non-highlighted lines
                                  },
                              ]
                            : []
                    }
                    className="p-1 overflow-auto"
                    isLightTheme={isLightTheme}
                    fetchHighlightedFileLines={fetchHighlightedFileLines}
                />
            )}
            <ThreadInboxItemActions
                {...props}
                inboxItem={inboxItem}
                onInboxItemUpdate={onInboxItemUpdate}
                className="border-top"
            />
        </div>
    )
}
