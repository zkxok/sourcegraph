import { Subscription, Unsubscribable } from 'rxjs'
import { first } from 'rxjs/operators'
import { Services } from '../api/client/services'
import { gql } from '../graphql/graphql'
import { PlatformContext } from '../platform/context'
import { createAggregateError } from '../util/errors'
import { parseRepoURI } from '../util/url'

export function registerFileSystemContributions(
    { fileSystem }: Pick<Services, 'fileSystem'>,
    { requestGraphQL }: Pick<PlatformContext, 'requestGraphQL'>
): Unsubscribable {
    const subscriptions = new Subscription()
    subscriptions.add(
        fileSystem.setProvider(async uri => {
            const parsed = parseRepoURI(uri.toString())
            const { data, errors } = await requestGraphQL({
                request: gql`
                    query ReadFile($repo: String!, $rev: String!, $path: String!) {
                        __typename
                        repository(name: $repo) {
                            commit(rev: $rev) {
                                blob(path: $path) {
                                    content
                                }
                            }
                        }
                    }
                `,
                variables: { repo: parsed.repoName, rev: parsed.rev || parsed.commitID, path: parsed.filePath },
                mightContainPrivateInfo: false,
            })
                .pipe(first())
                .toPromise()
            if (errors && errors.length > 0) {
                throw createAggregateError(errors)
            }
            if (
                !(
                    data &&
                    data.__typename === 'Query' &&
                    data.repository &&
                    data.repository.commit &&
                    data.repository.commit.blob
                )
            ) {
                throw new Error(`file not found: ${uri}`)
            }
            return data.repository.commit.blob.content
        })
    )
    return subscriptions
}
