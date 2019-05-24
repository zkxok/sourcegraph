import * as sourcegraph from 'sourcegraph'
import { ProxyInput, ProxyResult, proxyValue } from '@sourcegraph/comlink'
import { Subject, Unsubscribable } from 'rxjs'
import { LinkPreviewProvider } from 'sourcegraph'
import { ClientContentAPI } from '../../client/api/content'
import { syncSubscription } from '../../util'
import { toProxyableSubscribable } from './common'
import { ClientDiagnosticsAPI } from '../../client/api/diagnostics'
import { DiagnosticCollection } from '../../client/types/diagnosticCollection'

/** @internal */
export class ExtDiagnostics
    implements
        Pick<typeof sourcegraph.languages, 'diagnosticsChanges' | 'getDiagnostics' | 'createDiagnosticCollection'> {
    constructor(private proxy: ProxyResult<ClientDiagnosticsAPI>) {}

    public readonly diagnosticsChanges = new Subject<sourcegraph.DiagnosticChangeEvent>()

    public getDiagnostics(resource: URL): sourcegraph.Diagnostic[]
    public getDiagnostics(): [URL, sourcegraph.Diagnostic[]][]
    public getDiagnostics(resource?: URL): sourcegraph.Diagnostic[] | [URL, sourcegraph.Diagnostic[]][] {
        throw new Error(`not yet implemented ${resource}`)
    }

    public createDiagnosticCollection(name: string): sourcegraph.DiagnosticCollection {
        return new DiagnosticCollection<sourcegraph.Diagnostic>(name)
    }
}
