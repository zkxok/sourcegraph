export interface ThreadSettings {
    providers?: string[]
    queries?: string[]
    createPullRequests?: boolean
    pullRequestTemplate?: {
        title?: string
        branch?: string
        description?: string
    }
}
