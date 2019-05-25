import { Range } from '@sourcegraph/extension-api-classes'
import React, { useEffect, useState } from 'react'
import { Subscription } from 'rxjs'
import { first, switchMap } from 'rxjs/operators'
import * as sourcegraph from 'sourcegraph'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'
import { gql } from '../../../../../../shared/src/graphql/graphql'
import * as GQL from '../../../../../../shared/src/graphql/schema'
import { getModeFromPath } from '../../../../../../shared/src/languages'
import { queryGraphQL } from '../../../../backend/graphql'
import { fetchBlob } from '../../../../repo/blob/BlobPage'

interface Props extends ExtensionsControllerProps {
    inboxItem: GQL.IDiscussionThreadTargetRepo
}

/**
 * Previews a workspace edit's changes.
 */
export const WorkspaceEditPreview: React.FunctionComponent<Props> = ({ inboxItem, extensionsController }) => {
    const [workspaceEdit, setWorkspaceEdit] = useState<sourcegraph.WorkspaceEdit>()
    useEffect(() => {
        const subscriptions = new Subscription()

        const uri = `git://${inboxItem.repository.name}?master#${inboxItem.path!}`

        subscriptions.add(
            fetchBlob({
                repoName: inboxItem.repository.name,
                commitID: 'master',
                filePath: inboxItem.path!,
                disableTimeout: true,
                isLightTheme: false,
            })
                .pipe(
                    first(),
                    switchMap(blob => {
                        if (!extensionsController.services.model.hasModel(uri)) {
                            extensionsController.services.model.addModel({
                                uri,
                                languageId: getModeFromPath(inboxItem.path!),
                                text: blob.content,
                            })
                            subscriptions.add(() => extensionsController.services.model.removeModel(uri))
                        }
                        const editor = extensionsController.services.editor.addEditor({
                            type: 'CodeEditor',
                            resource: uri,
                            selections: [],
                            isActive: true,
                        })
                        subscriptions.add(() => extensionsController.services.editor.removeEditor(editor))

                        return extensionsController.services.codeActions.getCodeActions({
                            textDocument: { uri },
                            range: new Range(1, 2, 3, 4),
                            context: { diagnostics: [] },
                        })
                    })
                )
                .subscribe(codeActions => {
                    setWorkspaceEdit(codeActions && codeActions[0].edit ? codeActions[0].edit : undefined)
                })
        )
        return () => subscriptions.unsubscribe()
    }, [inboxItem, extensionsController])

    return (
        <div>
            {workspaceEdit ? (
                <ul className="list-group">
                    {Array.from(workspaceEdit.textEdits()).map((edit, i) => (
                        <li key={i} className="list-group-item">
                            {edit[0].toJSON()}: {JSON.stringify(edit[1])}
                        </li>
                    ))}
                </ul>
            ) : (
                <span className="m-2">No changes</span>
            )}
        </div>
    )
}
