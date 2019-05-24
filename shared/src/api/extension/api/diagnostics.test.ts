import { Range } from '@sourcegraph/extension-api-classes'
import * as sourcegraph from 'sourcegraph'

const FIXTURE_DIAGNOSTIC: sourcegraph.Diagnostic = {
    message: 'm',
    severity: 2 as sourcegraph.DiagnosticSeverity.Information,
    range: new Range(1, 2, 3, 4),
}

const FIXTURE_DIAGNOSTICS: sourcegraph.Diagnostic[] = [FIXTURE_DIAGNOSTIC]

const URL_1 = new URL('http://1')
const URL_2 = new URL('http://2')
