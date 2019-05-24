import { Diagnostic } from '@sourcegraph/extension-api-types'

/**
 * A collection of diagnostics.
 */
export class DiagnosticCollection<D extends Diagnostic> {
    /** Map of resource URI to the resource's diagnostics. */
    private data = new Map<string, D[]>()

    constructor(public readonly name: string) {}

    public set(uri: URL | string, diagnostics: D[] | undefined, merge?: boolean): void
    public set(entries: [URL | string, D[] | undefined][]): void
    public set(arg1: URL | string | [URL | string, D[] | undefined][], arg2?: D[] | undefined, merge = false): void {
        if (Array.isArray(arg1)) {
            this.clear()
            for (const [uri, diagnostics] of arg1) {
                this.set(uri.toString(), diagnostics, true)
            }
        } else {
            const key = arg1.toString()
            if (arg2) {
                this.data.set(key, merge ? [...(this.data.get(key) || []), ...arg2] : arg2)
            } else {
                this.data.delete(key)
            }
        }
    }

    public delete(uri: URL | string): void {
        this.data.delete(uri.toString())
    }

    public clear(): void {
        this.data.clear()
    }

    public *getAll(): IterableIterator<[URL, D[]]> {
        for (const [uri, diagnostics] of this.data) {
            yield [new URL(uri), diagnostics]
        }
    }

    public get(uri: URL | string): readonly D[] | undefined {
        return this.data.get(uri.toString())
    }

    public has(uri: URL | string): boolean {
        return this.data.has(uri.toString())
    }

    public unsubscribe(): void {
        this.clear()
    }
}

/**
 * A diagnostic collection that can only be read from, not written to. Other callers may write to
 * this diagnostic collection.
 */
export interface ReadonlyDiagnosticCollection
    extends Pick<DiagnosticCollection<Diagnostic>, 'getAll' | 'get' | 'has'> {}
