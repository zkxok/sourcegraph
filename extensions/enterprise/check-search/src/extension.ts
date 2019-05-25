import * as sourcegraph from 'sourcegraph'
import { registerDemo0 } from './demo0'

export function activate(ctx: sourcegraph.ExtensionContext): void {
    ctx.subscriptions.add(registerDemo0())
}
