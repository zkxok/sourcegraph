export interface IFileOperationOptions {
    overwrite?: boolean
    ignoreIfExists?: boolean
    ignoreIfNotExists?: boolean
    recursive?: boolean
}

export interface IFileOperation {
    _type: 1
    from?: URI
    to?: URI
    options?: IFileOperationOptions
}

export interface IFileTextEdit {
    _type: 2
    uri: URI
    edit: TextEdit
}

export class WorkspaceEdit implements vscode.WorkspaceEdit {
    private _edits = new Array<IFileOperation | IFileTextEdit>()

    renameFile(from: vscode.Uri, to: vscode.Uri, options?: { overwrite?: boolean; ignoreIfExists?: boolean }): void {
        this._edits.push({ _type: 1, from, to, options })
    }

    createFile(uri: vscode.Uri, options?: { overwrite?: boolean; ignoreIfExists?: boolean }): void {
        this._edits.push({ _type: 1, from: undefined, to: uri, options })
    }

    deleteFile(uri: vscode.Uri, options?: { recursive?: boolean; ignoreIfNotExists?: boolean }): void {
        this._edits.push({ _type: 1, from: uri, to: undefined, options })
    }

    replace(uri: URI, range: Range, newText: string): void {
        this._edits.push({ _type: 2, uri, edit: new TextEdit(range, newText) })
    }

    insert(resource: URI, position: Position, newText: string): void {
        this.replace(resource, new Range(position, position), newText)
    }

    delete(resource: URI, range: Range): void {
        this.replace(resource, range, '')
    }

    has(uri: URI): boolean {
        for (const edit of this._edits) {
            if (edit._type === 2 && edit.uri.toString() === uri.toString()) {
                return true
            }
        }
        return false
    }

    set(uri: URI, edits: TextEdit[]): void {
        if (!edits) {
            // remove all text edits for `uri`
            for (let i = 0; i < this._edits.length; i++) {
                const element = this._edits[i]
                if (element._type === 2 && element.uri.toString() === uri.toString()) {
                    this._edits[i] = undefined! // will be coalesced down below
                }
            }
            this._edits = coalesce(this._edits)
        } else {
            // append edit to the end
            for (const edit of edits) {
                if (edit) {
                    this._edits.push({ _type: 2, uri, edit })
                }
            }
        }
    }

    get(uri: URI): TextEdit[] {
        const res: TextEdit[] = []
        for (let candidate of this._edits) {
            if (candidate._type === 2 && candidate.uri.toString() === uri.toString()) {
                res.push(candidate.edit)
            }
        }
        return res
    }

    entries(): [URI, TextEdit[]][] {
        const textEdits = new Map<string, [URI, TextEdit[]]>()
        for (let candidate of this._edits) {
            if (candidate._type === 2) {
                let textEdit = textEdits.get(candidate.uri.toString())
                if (!textEdit) {
                    textEdit = [candidate.uri, []]
                    textEdits.set(candidate.uri.toString(), textEdit)
                }
                textEdit[1].push(candidate.edit)
            }
        }
        return values(textEdits)
    }

    _allEntries(): ([URI, TextEdit[]] | [URI?, URI?, IFileOperationOptions?])[] {
        const res: ([URI, TextEdit[]] | [URI?, URI?, IFileOperationOptions?])[] = []
        for (let edit of this._edits) {
            if (edit._type === 1) {
                res.push([edit.from, edit.to, edit.options])
            } else {
                res.push([edit.uri, [edit.edit]])
            }
        }
        return res
    }

    get size(): number {
        return this.entries().length
    }

    toJSON(): any {
        return this.entries()
    }
}
