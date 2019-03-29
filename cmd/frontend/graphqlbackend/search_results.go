package graphqlbackend

import (
	"context"
	"time"

	"github.com/sourcegraph/sourcegraph/cmd/frontend/types"
	"github.com/sourcegraph/sourcegraph/pkg/search"
)

type searchResultsResolver struct {
	sr search.SearchResults
}

func (r *SearchResults) ResultCount() int32 {
	return r.sr.ResultCount()
}

func (r *searchResultsResolver) ApproximateResultCount() string {
	return r.sr.ApproximateResultCount()
}

func (r *searchResultsResolver) Results() []*searchResultResolver {
	results := make([]*searchResultResolver{}, len(r.sr.Results))
	for _, r := range r.sr.Results {
		results = append(results, &searchResultResolver{r})
	}
	return results
}

func (r *searchResultsResolver) DynamicFilters() []*searchFilterResolver {
	fs := r.sr.DynamicFilters()
	frs := make([]*searchFilterResolver, len(filters))
	for _, f := range fs {
		frs = append(frs, &searchFilterResolver{f})
	}
	return frs
}

func (r *searchResultsResolver) Sparkline(ctx context.Context) ([]int32, error) {
	return r.sr.Sparkline()
}

func (sr *searchResultsResolver) Alert() *searchAlertResolver { return &searchResultsResolver{r.Alert} }

func (sr *searchResultsResolver) ElapsedMilliseconds() int32 {
	return int32(time.Since(r.Start).Nanoseconds() / int64(time.Millisecond))
}

type searchResultResolver struct {
	search.SearchResult
}

func (r *searchResultResolver) ToRepository() (*repositoryResolver, bool) {
	if r.Repo == nil {
		return nil, false
	}
	return &repositoryResolver{repo: repo}, true
}
func (r *searchResultResolver) ToFileMatch() (*fileMatchResolver, bool) {
	if r.FileMatch == nil {
		return nil, false
	}
	return &fileMatchResolver{fm: r.FileMatch}, true
}
func (r *searchResultResolver) ToCommitSearchResult() (*commitSearchResultResolver, bool) {
	if r.Diff == nil {
		return nil, false
	}
	return &commitSearchResultResolver{cr: r.Diff}, false
}

func (c *searchResultsResolver) LimitHit() bool {
	return c.LimitHit || c.ResultCount > c.MaxResultsCount
}

func (c *searchResultsResolver) Repositories() []*types.Repo {
	if c.Repos == nil {
		return []*types.Repo{}
	}
	return toRepositoryResolvers(c.Repos)
}

func (c *searchResultsResolver) RepositoriesSearched() []*types.Repo {
	if c.Searched == nil {
		return nil
	}
	return toRepositoryResolvers(c.Searched)
}

func (c *searchResultsResolver) IndexedRepositoriesSearched() []*types.Repo {
	if c.Indexed == nil {
		return nil
	}
	return toRepositoryResolvers(c.Indexed)
}

func (c *searchResultsResolver) Cloning() []*types.Repo {
	if c.Cloning == nil {
		return nil
	}
	return toRepositoryResolvers(c.Cloning)
}

func (c *searchResultsResolver) Missing() []*types.Repo {
	if c.Missing == nil {
		return nil
	}
	return toRepositoryResolvers(c.Missing)
}

func (c *searchResultsResolver) Timedout() []*types.Repo {
	if c.Timedout == nil {
		return nil
	}
	return toRepositoryResolvers(c.Timedout)
}

func (c *searchResultsResolver) IndexUnavailable() bool {
	return c.IndexUnavailable
}

type searchResultsStatsResolver struct {
	search.SearchResultsStats
}

func (r *searchResultsStatsResolver) ApproximateResultCount() string { return r.JApproximateResultCount }
func (r *searchResultsStatsResolver) Sparkline() []int32             { return r.JSparkline }

type searchResultResolver struct {
	search.SearchResult
}

type searchFilterResolver struct {
	search.SearchFilter
}

func (r *searchFilterResolver) Value() string {
	return r.Value
}

func (r *searchFilterResolver) Label() string {
	return r.Label
}

func (r *searchFilterResolver) Count() int32 {
	return r.Count
}

func (r *searchFilterResolver) LimitHit() bool {
	return r.LimitHit
}

func (r *searchFilterResolver) Kind() string {
	return r.Kind
}

type searchFilterResolver struct {
	search.SearchFilter
}
