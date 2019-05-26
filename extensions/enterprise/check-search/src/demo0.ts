import * as sourcegraph from 'sourcegraph'
import { flatten } from 'lodash'
import { Subscription, Observable, of, Unsubscribable, from } from 'rxjs'
import { map, switchMap, startWith, first, toArray } from 'rxjs/operators'
import { queryGraphQL } from './util'
import * as GQL from '../../../../shared/src/graphql/schema'

export function registerDemo0(): Unsubscribable {
    const subscriptions = new Subscription()
    subscriptions.add(startDiagnostics())
    subscriptions.add(sourcegraph.languages.registerCodeActionProvider(['*'], createCodeActionProvider()))
    return subscriptions
}

function startDiagnostics(): Unsubscribable {
    const subscriptions = new Subscription()

    const diagnosticsCollection = sourcegraph.languages.createDiagnosticCollection('demo0')
    subscriptions.add(diagnosticsCollection)
    subscriptions.add(
        from(sourcegraph.workspace.rootChanges)
            .pipe(
                startWith(void 0),
                map(() => sourcegraph.workspace.roots),
                switchMap(async () => {
                    const results = flatten(
                        await from(
                            sourcegraph.search.findTextInFiles(
                                { pattern: '', type: 'regexp' },
                                {
                                    repositories: { includes: ['sourcegraph$'], type: 'regexp' },
                                    files: {
                                        includes: ['^web/src/(components|repo|enterprise)/.*\\.tsx?$'],
                                        type: 'regexp',
                                    },
                                    maxResults: 4,
                                }
                            )
                        )
                            .pipe(toArray())
                            .toPromise()
                    )
                    return Promise.all(
                        results.map(async ({ uri }) => {
                            const { text } = await sourcegraph.workspace.openTextDocument(new URL(uri))
                            const diagnostics: sourcegraph.Diagnostic[] = findMatchRanges(text).map(
                                range =>
                                    ({
                                        message: 'Found foo',
                                        range,
                                        severity: sourcegraph.DiagnosticSeverity.Hint,
                                    } as sourcegraph.Diagnostic)
                            )
                            return [new URL(uri), diagnostics] as [URL, sourcegraph.Diagnostic[]]
                        })
                    )
                })
            )
            .subscribe(entries => {
                diagnosticsCollection.set(entries)
            })
    )

    subscriptions.add(
        sourcegraph.workspace.openedTextDocuments.subscribe(doc => {
            diagnosticsCollection.set(new URL(doc.uri), [
                {
                    message: 'My diagnostic',
                    range: new sourcegraph.Range(1, 2, 10, 4),
                    severity: sourcegraph.DiagnosticSeverity.Error,
                },
            ])
        })
    )

    return diagnosticsCollection
}

function createCodeActionProvider(): sourcegraph.CodeActionProvider {
    return {
        provideCodeActions: (doc, rangeOrSelection, context): Observable<sourcegraph.CodeAction[]> => {
            const workspaceEdit = new sourcegraph.WorkspaceEdit()
            for (const range of findMatchRanges(doc.text)) {
                workspaceEdit.replace(new URL(doc.uri), range, 'let')
            }
            return of<sourcegraph.CodeAction[]>([{ title: 'Replace const -> let', edit: workspaceEdit }])
        },
    }
}

function findMatchRanges(text: string): sourcegraph.Range[] {
    const ranges: sourcegraph.Range[] = []
    for (const [i, line] of text.split('\n').entries()) {
        const pat = /\b(function|const|class)\b/g
        for (let match = pat.exec(line); !!match; match = pat.exec(line)) {
            ranges.push(new sourcegraph.Range(i, match.index, i, match.index + match[0].length))
        }
    }
    return ranges
}
