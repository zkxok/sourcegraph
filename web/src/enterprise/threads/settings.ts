import * as GQL from '../../../../shared/src/graphql/schema'

export interface PullRequest {
    repo: string
    title?: string
    label?: string
    number?: number
    status: 'open' | 'merged' | 'closed' | 'pending'
    commentsCount?: number
    items: GQL.ID[]
}

export interface ThreadSettings {
    providers?: string[]
    queries?: string[]
    createPullRequests?: boolean
    pullRequests?: PullRequest[]
    pullRequestTemplate?: {
        title?: string
        branch?: string
        description?: string
    }
}
