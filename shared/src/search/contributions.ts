import { Subscription, Unsubscribable } from 'rxjs'
import { first } from 'rxjs/operators'
import { IncludeExcludePatterns } from 'sourcegraph'
import { Services } from '../api/client/services'
import { PlatformContext } from '../platform/context'
import { createAggregateError } from '../util/errors'
import { isDefined } from '../util/types'

export function registerSearchContributions(
    { searchProviders }: Pick<Services, 'searchProviders'>,
    { requestGraphQL }: Pick<PlatformContext, 'requestGraphQL'>
): Unsubscribable {
    const subscriptions = new Subscription()
    subscriptions.add(
        searchProviders.registerProvider({}, async params => {
            const { data, errors } = await requestGraphQL({
                request: `
				query Search($query: String!) {
						__typename
						search(query: $query) {
								results {
										results {
												__typename
												... on FileMatch {
														file {
																path
																content
																repository {
																		name
																}
																commit {
																		oid
																}
														}
												}
										}
								}
						}
				}`,
                variables: {
                    // TODO!(sqs): this is hacky
                    query: [
                        params.options &&
                            params.options.repositories &&
                            formatIncludeExcludePatterns('repo:', params.options.repositories),
                        params.options &&
                            params.options.files &&
                            formatIncludeExcludePatterns('file:', params.options.files),
                        params.options && params.options.maxResults && `count:${params.options.maxResults}`,
                        params.query,
                    ]
                        .filter(isDefined)
                        .join(' '),
                },
                mightContainPrivateInfo: false,
            })
                .pipe(first())
                .toPromise()
            if (errors && errors.length > 0) {
                throw createAggregateError(errors)
            }
            return data && data.__typename === 'Query' && data.search
                ? data.search.results.results.map(result => ({ uri: 'TODO!(sqs)' }))
                : []
        })
    )
    return subscriptions
}

function formatIncludeExcludePatterns(
    keyword: string,
    { includes, excludes, type }: IncludeExcludePatterns
): string | undefined {
    if (type !== 'regexp') {
        throw new Error(`unsupported IncludeExcludePatterns type: ${type}`)
    }
    const format = (
        prefix: string,
        keyword: string,
        patterns: IncludeExcludePatterns['includes'] | IncludeExcludePatterns['excludes']
    ) => {
        if (!patterns || patterns.length === 0) {
            return undefined
        }
        if (patterns.length >= 2) {
            throw new Error(`2+ patterns in IncludeExcludePatterns is not supported`)
        }
        return `${prefix}${keyword}${patterns[0]}`
    }
    const parts = [format('', keyword, includes), format('-', keyword, includes)].filter(isDefined)
    return parts.length === 0 ? undefined : parts.join(' ')
}
