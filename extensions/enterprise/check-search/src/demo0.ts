import * as sourcegraph from 'sourcegraph'
import { flatten } from 'lodash'
import { Subscription, Observable, of, Unsubscribable, from } from 'rxjs'
import { map, switchMap, startWith } from 'rxjs/operators'
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
                    const resp: GQL.IGraphQLResponseRoot = await queryGraphQL({
                        query: `
                    query CandidateFiles($query: String!) {
                        __typename
                        search(query: $query) {
                            results {
                                results {
                                    __typename
                                    ... on FileMatch {
                                        file {
                                            path
                                            content
                                            repository {
                                                name
                                            }
                                            commit {
                                                oid
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }`,
                        vars: { query: 'lang:typescript' },
                    })
                    if (resp.errors && resp.errors.length > 0) {
                        throw new Error(`GraphQL error: ${resp.errors.map(e => e.message).join(', ')}`)
                    }
                    const fileMatches =
                        resp.data &&
                        resp.data.__typename === 'Query' &&
                        resp.data.search &&
                        resp.data.search.results &&
                        resp.data.search.results.results
                            ? resp.data.search.results.results.filter(
                                  (r): r is GQL.IFileMatch => r.__typename === 'FileMatch'
                              )
                            : []

                    return fileMatches.map(({ file }) => {
                        const uri = `git://${file.repository.name}?${file.commit.oid}#${file.path}`
                        const diagnostics: sourcegraph.Diagnostic[] = findMatchRanges(file.content).map(
                            range =>
                                ({
                                    message: 'Found foo',
                                    range,
                                    severity: sourcegraph.DiagnosticSeverity.Hint,
                                } as sourcegraph.Diagnostic)
                        )
                        return [new URL(uri), diagnostics] as [URL, sourcegraph.Diagnostic[]]
                    })
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
