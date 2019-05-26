import { WorkspaceEdit } from 'sourcegraph'
import { ExtensionsControllerProps } from '../../../../../../shared/src/extensions/controller'

export async function computeWorkspaceEditDiff(
    { services: { fileSystem } }: ExtensionsControllerProps['extensionsController'],
    workspaceEdit: WorkspaceEdit
): Promise<{ diff: string }> {
    return { diff: 'abcd hello!' }
}
