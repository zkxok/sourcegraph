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
import { DiagnosticSeverityIcon } from '../../../../diagnostics/components/DiagnosticSeverityIcon'
import { ThreadSettings } from '../../settings'
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
    headerClassName?: string
    headerStyle?: React.CSSProperties
    isLightTheme: boolean
    history: H.History
    location: H.Location
}

/**
 * An inbox item in a thread that refers to a diagnostic.
 */
export const ThreadInboxDiagnosticItem: React.FunctionComponent<Props> = ({
    diagnostic,
    className = '',
    headerClassName = '',
    headerStyle,
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

    return (
        <div className={`card border ${className}`}>
            <div className={`card-header d-flex align-items-center ${headerClassName}`} style={headerStyle}>
                <DiagnosticSeverityIcon severity={diagnostic.severity} className="icon-inline mr-2" />
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
                codeActionsOrError.map((codeAction, i) =>
                    codeAction.edit ? (
                        <WorkspaceEditPreview
                            key={i}
                            {...props}
                            workspaceEdit={codeAction.edit}
                            extensionsController={extensionsController}
                            className="overflow-auto"
                        />
                    ) : (
                        'no edit'
                    )
                )
            )}
            {/*     <ThreadInboxItemActions {...props} diagnostic={diagnostic} className="border-top" /> TODO!(sqs)*/}
        </div>
    )
}
