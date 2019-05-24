import * as sourcegraph from 'sourcegraph'
import { TextEdit } from './textEdit'

/**
 * An edit to resources in the workspace, including text edits and file operations.
 *
 * @see module:sourcegraph.WorkspaceEdit
 */
export interface WorkspaceEdit {
    readonly entries: ([string, TextEdit[]] | [string?, string?, FileOperationOptions?])[]
}
