import { Range } from '@sourcegraph/extension-api-classes'
import { Diagnostic } from '@sourcegraph/extension-api-types'
import * as sourcegraph from 'sourcegraph'
import { DiagnosticCollection } from './diagnosticCollection'

const FIXTURE_DIAGNOSTIC_1: Diagnostic = {
    message: 'm',
    severity: 2 as sourcegraph.DiagnosticSeverity.Information,
    range: new Range(1, 2, 3, 4),
}

const FIXTURE_DIAGNOSTICS: Diagnostic[] = [FIXTURE_DIAGNOSTIC_1]

const FIXTURE_DIAGNOSTIC_2: Diagnostic = {
    message: 'm2',
    severity: 3 as sourcegraph.DiagnosticSeverity.Information,
    range: new Range(5, 6, 7, 8),
}

const URL_1 = new URL('http://1')
const URL_2 = new URL('http://2')

describe('DiagnosticCollection', () => {
    test('', () => {
        const c = new DiagnosticCollection('a')
        expect(c.name).toBe('a')

        c.set(URL_1, FIXTURE_DIAGNOSTICS)
        expect(Array.from(c.getAll())).toEqual([[URL_1, FIXTURE_DIAGNOSTICS]])
        expect(c.get(URL_1)).toEqual(FIXTURE_DIAGNOSTICS)
        expect(c.get(URL_2)).toBe(undefined)
        expect(c.has(URL_1)).toBe(true)
        expect(c.has(URL_2)).toBe(false)

        c.delete(URL_1)
        expect(Array.from(c.getAll())).toEqual([])
        expect(c.get(URL_1)).toBe(undefined)
        expect(c.has(URL_1)).toBe(false)
    })

    test('set merges', () => {
        const c = new DiagnosticCollection('a')

        c.set(URL_1, [FIXTURE_DIAGNOSTIC_2])
        c.set([[URL_1, FIXTURE_DIAGNOSTICS], [URL_1, FIXTURE_DIAGNOSTICS]])
        expect(Array.from(c.getAll())).toEqual([[URL_1, [...FIXTURE_DIAGNOSTICS, ...FIXTURE_DIAGNOSTICS]]])
    })
})
