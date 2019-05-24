import { Position, Range } from '@sourcegraph/extension-api-classes'
import * as sourcegraph from 'sourcegraph'
import { TextEdit } from './textEdit'

export interface FileOperationOptions {
    overwrite?: boolean
    ignoreIfExists?: boolean
    ignoreIfNotExists?: boolean
    recursive?: boolean
}

export enum WorkspaceEditOperationType {
    FileOperation,
    FileTextEdit,
}

export interface FileOperation {
    type: WorkspaceEditOperationType.FileOperation
    from?: URL
    to?: URL
    options?: FileOperationOptions
}

export interface FileTextEdit {
    type: WorkspaceEditOperationType.FileTextEdit
    uri: URL
    edit: sourcegraph.TextEdit
}

export class WorkspaceEdit implements sourcegraph.WorkspaceEdit {
    private _edits: (FileOperation | FileTextEdit)[] = []

    public textEdits(): IterableIterator<[URL, sourcegraph.TextEdit[]]> {
        return this.groupedEntries().values()
    }

    public entries(): ([URL, sourcegraph.TextEdit[]] | [URL?, URL?, FileOperationOptions?])[] {
        const res: ([URL, sourcegraph.TextEdit[]] | [URL?, URL?, FileOperationOptions?])[] = []
        for (const edit of this._edits) {
            if (edit.type === WorkspaceEditOperationType.FileOperation) {
                res.push([edit.from, edit.to, edit.options])
            } else {
                res.push([edit.uri, [edit.edit]])
            }
        }
        return res
    }

    private groupedEntries(): Map<string, [URL, sourcegraph.TextEdit[]]> {
        const textEdits = new Map<string, [URL, sourcegraph.TextEdit[]]>()
        for (const candidate of this._edits) {
            if (candidate.type === WorkspaceEditOperationType.FileTextEdit) {
                let textEdit = textEdits.get(candidate.uri.toString())
                if (!textEdit) {
                    textEdit = [candidate.uri, []]
                    textEdits.set(candidate.uri.toString(), textEdit)
                }
                textEdit[1].push(candidate.edit)
            }
        }
        return textEdits
    }

    public get size(): number {
        return this.groupedEntries().size
    }

    public get(uri: URL): sourcegraph.TextEdit[] {
        const res: sourcegraph.TextEdit[] = []
        for (const candidate of this._edits) {
            if (
                candidate.type === WorkspaceEditOperationType.FileTextEdit &&
                candidate.uri.toString() === uri.toString()
            ) {
                res.push(candidate.edit)
            }
        }
        return res
    }

    public has(uri: URL): boolean {
        for (const edit of this._edits) {
            if (edit.type === WorkspaceEditOperationType.FileTextEdit && edit.uri.toString() === uri.toString()) {
                return true
            }
        }
        return false
    }

    public set(uri: URL, edits?: sourcegraph.TextEdit[]): void {
        if (!edits) {
            // Remove all text edits for `uri`.
            this._edits = this._edits.filter(
                edit =>
                    !(edit.type === WorkspaceEditOperationType.FileTextEdit && edit.uri.toString() === uri.toString())
            )
        } else {
            // Append edit to the end.
            for (const edit of edits) {
                if (edit) {
                    this._edits.push({ type: WorkspaceEditOperationType.FileTextEdit, uri, edit })
                }
            }
        }
    }

    public createFile(uri: URL, options?: { overwrite?: boolean; ignoreIfExists?: boolean }): void {
        this._edits.push({ type: WorkspaceEditOperationType.FileOperation, from: undefined, to: uri, options })
    }

    public deleteFile(uri: URL, options?: { recursive?: boolean; ignoreIfNotExists?: boolean }): void {
        this._edits.push({ type: WorkspaceEditOperationType.FileOperation, from: uri, to: undefined, options })
    }

    public renameFile(from: URL, to: URL, options?: { overwrite?: boolean; ignoreIfExists?: boolean }): void {
        this._edits.push({ type: WorkspaceEditOperationType.FileOperation, from, to, options })
    }

    public replace(uri: URL, range: Range, newText: string): void {
        this._edits.push({ type: WorkspaceEditOperationType.FileTextEdit, uri, edit: new TextEdit(range, newText) })
    }

    public insert(resource: URL, position: Position, newText: string): void {
        this.replace(resource, new Range(position, position), newText)
    }

    public delete(resource: URL, range: Range): void {
        this.replace(resource, range, '')
    }

    public toJSON(): any {
        return this.textEdits()
    }
}
