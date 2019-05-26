import { PlatformContext } from '../../../platform/context'

/**
 * The file system service manages file systems.
 */
export interface FileSystemService {
    /**
     * Read the contents of the resource at the URI.
     */
    readFile(uri: URL): Promise<string>
}

/**
 * Creates a new instance of {@link FileSystemService}.
 */
export function createFileSystemService({ readFile }: Pick<PlatformContext, 'readFile'>): FileSystemService {
    return { readFile }
}
