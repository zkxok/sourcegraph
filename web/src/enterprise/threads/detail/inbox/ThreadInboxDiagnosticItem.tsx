import { Range } from '@sourcegraph/extension-api-classes'
import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import classNames from 'classnames'
import H from 'history'
import { upperFirst } from 'lodash'
import AlertCircleOutlineIcon from 'mdi-react/AlertCircleOutlineIcon'
import React, { useEffect, useState } from 'react'
import { from, Subscription } from 'rxjs'
import { catchError, map, startWith } from 'rxjs/operators'
import * as sourcegraph from 'sourcegraph'
import { DiagnosticSeverity } from '../../../../../../shared/src/api/types/diagnosticCollection'
import { LinkOrSpan } from '../../../../../../shared/src/components/LinkOrSpan'
import { displayRepoName } from '../../../../../../shared/src/components/RepoFileLink'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { PlatformContextProps } from '../../../../../../shared/src/platform/context'
import { asError, ErrorLike, isErrorLike } from '../../../../../../shared/src/util/errors'
import { makeRepoURI } from '../../../../../../shared/src/util/url'
import { fetchHighlightedFileLines } from '../../../../repo/backend'
import { FileDiffHunks } from '../../../../repo/compare/FileDiffHunks'
import { ThreadSettings } from '../../settings'
import { ThreadInboxItemActions } from './ThreadInboxItemActions'
import { WorkspaceEditPreview } from './WorkspaceEditPreview'

export interface DiagnosticInfo extends sourcegraph.Diagnostic {
    entry: Pick<GQL.ITreeEntry, 'path' | 'isDirectory' | 'url'> & {
        commit: Pick<GQL.IGitCommit, 'oid'>
        repository: Pick<GQL.IRepository, 'name'>
    } & (Pick<GQL.IGitBlob, '__typename' | 'content'> | Pick<GQL.IGitTree, '__typename'>)
}

const LOADING: 'loading' = 'loading'

interface Props extends ExtensionsControllerProps, PlatformContextProps {
    thread: Pick<GQL.IDiscussionThread, 'id' | 'idWithoutKind' | 'settings'>
    onThreadUpdate: (thread: GQL.IDiscussionThread) => void
    threadSettings: ThreadSettings
    diagnostic: DiagnosticInfo
    className?: string
    isLightTheme: boolean
    history: H.History
    location: H.Location
}

const SEVERITY_ICON: Record<
    typeof DiagnosticSeverity[keyof typeof DiagnosticSeverity],
    React.ComponentType<{ className?: string }>
> = {
    [DiagnosticSeverity.Error]: AlertCircleOutlineIcon,
    [DiagnosticSeverity.Warning]: AlertCircleOutlineIcon,
    [DiagnosticSeverity.Information]: AlertCircleOutlineIcon,
    [DiagnosticSeverity.Hint]: AlertCircleOutlineIcon,
}

const statusIcon = ({
    severity,
}: Pick<sourcegraph.Diagnostic, 'severity'>): React.ComponentType<{ className?: string }> =>
    SEVERITY_ICON[severity] || AlertCircleOutlineIcon

/**
 * An inbox item in a thread that refers to a diagnostic.
 */
export const ThreadInboxDiagnosticItem: React.FunctionComponent<Props> = ({
    diagnostic,
    className = '',
    isLightTheme,
    extensionsController,
    ...props
}) => {
    const [codeActionsOrError, setCodeActionsOrError] = useState<typeof LOADING | sourcegraph.CodeAction[] | ErrorLike>(
        LOADING
    )
    // tslint:disable-next-line: no-floating-promises
    useEffect(() => {
        const subscriptions = new Subscription()
        subscriptions.add(
            from(
                extensionsController.services.codeActions.getCodeActions({
                    textDocument: {
                        uri: makeRepoURI({
                            repoName: diagnostic.entry.repository.name,
                            rev: diagnostic.entry.commit.oid,
                            commitID: diagnostic.entry.commit.oid,
                            filePath: diagnostic.entry.path,
                        }),
                    },
                    range: Range.fromPlain(diagnostic.range),
                    context: { diagnostics: [diagnostic] },
                })
            )
                .pipe(
                    map(codeActions => codeActions || []),
                    catchError(err => [asError(err)]),
                    startWith(LOADING)
                )
                .subscribe(setCodeActionsOrError)
        )
        return () => subscriptions.unsubscribe()
    }, [diagnostic, extensionsController])

    const Icon = statusIcon(diagnostic)
    return (
        <div className={`card border ${className}`}>
            <div className="card-header d-flex align-items-center">
                <Icon
                    className={classNames('icon-inline', 'mr-2', 'h5', 'mb-0', {
                        'text-danger': diagnostic.severity === DiagnosticSeverity.Error,
                        'text-warning': diagnostic.severity === DiagnosticSeverity.Warning,
                        'text-info': diagnostic.severity === DiagnosticSeverity.Information,
                        'text-success': diagnostic.severity === DiagnosticSeverity.Hint,
                        // TODO!(sqs) 'text-muted': diagnostic.,
                    })}
                    data-tooltip={upperFirst(status)}
                />
                <div className="flex-1">
                    <h3 className="d-flex align-items-center mb-0 h6">
                        <LinkOrSpan to={diagnostic.entry.url} className="text-body">
                            {diagnostic.entry.path ? (
                                <>
                                    <span className="font-weight-normal">
                                        {displayRepoName(diagnostic.entry.repository.name)}
                                    </span>{' '}
                                    › {diagnostic.entry.path}
                                </>
                            ) : (
                                displayRepoName(diagnostic.entry.repository.name)
                            )}
                        </LinkOrSpan>{' '}
                        &mdash; {diagnostic.message}
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
            {codeActionsOrError === LOADING ? (
                <LoadingSpinner className="icon-inline" />
            ) : isErrorLike(codeActionsOrError) ? (
                <span className="text-danger">{codeActionsOrError.message}</span>
            ) : (
                <WorkspaceEditPreview {...props} diagnostic={diagnostic} />
            )}
            {/*     <ThreadInboxItemActions {...props} diagnostic={diagnostic} className="border-top" /> TODO!(sqs)*/}
        </div>
    )
}
