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
import { ThreadInboxItemActions } from './ThreadInboxItemActions'

interface Props extends ExtensionsControllerProps {
    item: GQL.IDiscussionThreadTargetRepo
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
    item,
    onInboxItemUpdate,
    className = '',
    isLightTheme,
    ...props
}) => {
    const Icon = statusIcon(item)
    return (
        <div className={`card border ${className}`}>
            <div className="card-header d-flex align-items-center">
                <Icon
                    className={classNames('icon-inline', 'mr-2', 'h5', 'mb-0', {
                        'text-info': !item.isIgnored,
                        'text-muted': item.isIgnored,
                    })}
                    data-tooltip={upperFirst(status)}
                />
                <div className="flex-1">
                    <h3 className="d-flex align-items-center mb-0 h6">
                        <LinkOrSpan to={item.url} className="text-body">
                            {item.path ? (
                                <>
                                    <span className="font-weight-normal">{displayRepoName(item.repository.name)}</span>{' '}
                                    › {item.path}
                                </>
                            ) : (
                                displayRepoName(item.repository.name)
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
            {item.path && (
                <CodeExcerpt
                    repoName={item.repository.name}
                    commitID="master" // TODO!(sqs)
                    filePath={item.path}
                    context={3}
                    highlightRanges={
                        item.selection
                            ? [
                                  {
                                      line: item.selection.startLine,
                                      character: item.selection.startCharacter,
                                      highlightLength:
                                          item.selection.endCharacter - item.selection.startCharacter || 10, // TODO!(sqs): hack to avoid having non-highlighted lines
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
                inboxItem={item}
                onInboxItemUpdate={onInboxItemUpdate}
                className="border-top"
            />
        </div>
    )
}
