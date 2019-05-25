import * as sourcegraph from 'sourcegraph'
import { Subscription, Observable, of, Unsubscribable } from 'rxjs'

export function registerDemo0(): Unsubscribable {
    const subscriptions = new Subscription()
    subscriptions.add(startDiagnostics())
    subscriptions.add(sourcegraph.languages.registerCodeActionProvider(['*'], createCodeActionProvider()))
    return subscriptions
}

function startDiagnostics(): Unsubscribable {
    const subscriptions = new Subscription()

    const diags = sourcegraph.languages.createDiagnosticCollection('demo0')
    subscriptions.add(diags)

    subscriptions.add(
        sourcegraph.workspace.openedTextDocuments.subscribe(doc => {
            diags.set(new URL(doc.uri), [
                {
                    message: 'My diagnostic',
                    range: new sourcegraph.Range(1, 2, 10, 4),
                    severity: sourcegraph.DiagnosticSeverity.Error,
                },
            ])
        })
    )

    return diags
}

function createCodeActionProvider(): sourcegraph.CodeActionProvider {
    return {
        provideCodeActions: (doc, rangeOrSelection, context): Observable<sourcegraph.CodeAction[]> => {
            const workspaceEdit = new sourcegraph.WorkspaceEdit()
            for (const [i, line] of doc.text.split('\n').entries()) {
                const pat = /\b(function|const|class)\b/g
                for (let match = pat.exec(line); !!match; match = pat.exec(line)) {
                    workspaceEdit.replace(
                        new URL(doc.uri),
                        new sourcegraph.Range(i, match.index, i, match.index + match[0].length),
                        'let'
                    )
                }
            }
            return of<sourcegraph.CodeAction[]>([{ title: 'Replace const -> let', edit: workspaceEdit }])
        },
    }
}
