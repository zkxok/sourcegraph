import { ProxyResult, ProxyValue, proxyValue, proxyValueSymbol } from '@sourcegraph/comlink'
import { from, Subscribable, of } from 'rxjs'
import { QueryTransformer, SearchOptions, SearchQuery, Unsubscribable, TextSearchResult } from 'sourcegraph'
import { TransformQuerySignature } from '../services/queryTransformer'
import { FeatureProviderRegistry } from '../services/registry'
import { ProxySubscribable, toProxyableSubscribable } from '../../extension/api/common'
import { ProvideTextSearchResultsParams, ProvideTextSearchResultsSignature } from '../services/searchProviders'
import { wrapRemoteObservable } from './common'

/** @internal */
export interface ClientSearchAPI extends ProxyValue {
    $findTextInFiles(params: ProvideTextSearchResultsParams): ProxySubscribable<TextSearchResult[]> & ProxyValue
    $registerQueryTransformer(transformer: ProxyResult<QueryTransformer & ProxyValue>): Unsubscribable & ProxyValue
    $registerTextSearchProvider(
        providerFunction: ProxyResult<
            ((params: ProvideTextSearchResultsParams) => ProxySubscribable<TextSearchResult[]>) & ProxyValue
        >
    ): Unsubscribable & ProxyValue
}

/** @internal */
export class ClientSearch implements ClientSearchAPI, ProxyValue {
    public readonly [proxyValueSymbol] = true

    constructor(
        private queryTransformerRegistry: FeatureProviderRegistry<{}, TransformQuerySignature>,
        private searchProviderRegistry: FeatureProviderRegistry<{}, ProvideTextSearchResultsSignature>
    ) {}

    public $findTextInFiles(
        params: ProvideTextSearchResultsParams
    ): ProxySubscribable<TextSearchResult[]> & ProxyValue {
        return toProxyableSubscribable(of<TextSearchResult[]>([{ uri: new URL('file:///SR1') }]), items => items)
    }

    public $registerQueryTransformer(
        transformer: ProxyResult<QueryTransformer & ProxyValue>
    ): Unsubscribable & ProxyValue {
        return proxyValue(
            this.queryTransformerRegistry.registerProvider({}, query => from(transformer.transformQuery(query)))
        )
    }

    public $registerTextSearchProvider(
        providerFunction: ProxyResult<
            ((params: ProvideTextSearchResultsParams) => ProxySubscribable<TextSearchResult[]>) & ProxyValue
        >
    ): Unsubscribable & ProxyValue {
        return proxyValue(
            this.searchProviderRegistry.registerProvider({}, params => wrapRemoteObservable(providerFunction(params)))
        )
    }
}
