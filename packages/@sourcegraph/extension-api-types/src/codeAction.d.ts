import * as sourcegraph from 'sourcegraph'
import { Diagnostic } from './diagnostic'
import { WorkspaceEdit } from './workspaceEdit'

/**
 * A code action.
 *
 * @see module:sourcegraph.CodeAction
 */
export interface CodeAction
    extends Pick<sourcegraph.Diagnostic, Exclude<keyof sourcegraph.Diagnostic, 'edit' | 'diagnostics'>> {
    readonly edit?: WorkspaceEdit
    readonly diagnostics?: Diagnostic[]
}
