import { Diagnostic } from '@sourcegraph/extension-api-types'
import { DiagnosticCollection } from '../types/diagnosticCollection'

/**
 * The diagnostics service publishes diagnostics about resources.
 */
export interface DiagnosticsService {
    /** The diagnostic collection, containing all diagnostics. */
    readonly collection: DiagnosticCollection<Diagnostic>
}

/**
 * Creates a {@link DiagnosticsService} instance.
 */
export function createDiagnosticsService(): DiagnosticsService {
    const collection = new DiagnosticCollection('')
    return { collection }
}
