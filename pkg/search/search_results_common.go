package search

import (
	"sort"

	"github.com/sourcegraph/sourcegraph/cmd/frontend/types"
	"github.com/sourcegraph/sourcegraph/pkg/api"
)

// searchResultsCommon contains fields that should be returned by all funcs
// that contribute to the overall search result set.
type searchResultsCommon struct {
	limitHit bool                      // whether the limit on results was hit
	repos    []*types.Repo             // repos that were matched by the repo-related filters
	searched []*types.Repo             // repos that were searched
	indexed  []*types.Repo             // repos that were searched using an index
	cloning  []*types.Repo             // repos that could not be searched because they were still being cloned
	missing  []*types.Repo             // repos that could not be searched because they do not exist
	partial  map[api.RepoName]struct{} // repos that were searched, but have results that were not returned due to exceeded limits

	maxResultsCount, resultCount int32

	// timedout usually contains repos that haven't finished being fetched yet.
	// This should only happen for large repos and the searcher caches are
	// purged.
	timedout []*types.Repo

	indexUnavailable bool // True if indexed search is enabled but was not available during this search.
}

func (c *searchResultsCommon) LimitHit() bool {
	return c.limitHit || c.resultCount > c.maxResultsCount
}

func (c *searchResultsCommon) Repositories() []*types.Repo {
	if c.repos == nil {
		return []*types.Repo{}
	}
	return toRepositoryResolvers(c.repos)
}

func (c *searchResultsCommon) RepositoriesSearched() []*types.Repo {
	if c.searched == nil {
		return nil
	}
	return toRepositoryResolvers(c.searched)
}

func (c *searchResultsCommon) IndexedRepositoriesSearched() []*types.Repo {
	if c.indexed == nil {
		return nil
	}
	return toRepositoryResolvers(c.indexed)
}

func (c *searchResultsCommon) Cloning() []*types.Repo {
	if c.cloning == nil {
		return nil
	}
	return toRepositoryResolvers(c.cloning)
}

func (c *searchResultsCommon) Missing() []*types.Repo {
	if c.missing == nil {
		return nil
	}
	return toRepositoryResolvers(c.missing)
}

func (c *searchResultsCommon) Timedout() []*types.Repo {
	if c.timedout == nil {
		return nil
	}
	return toRepositoryResolvers(c.timedout)
}

func (c *searchResultsCommon) IndexUnavailable() bool {
	return c.indexUnavailable
}

// update updates c with the other data, deduping as necessary. It modifies c but
// does not modify other.
func (c *searchResultsCommon) update(other searchResultsCommon) {
	c.limitHit = c.limitHit || other.limitHit
	c.indexUnavailable = c.indexUnavailable || other.indexUnavailable

	appendUnique := func(dstp *[]*types.Repo, src []*types.Repo) {
		dst := *dstp
		sort.Slice(dst, func(i, j int) bool { return dst[i].ID < dst[j].ID })
		sort.Slice(src, func(i, j int) bool { return src[i].ID < src[j].ID })
		for _, r := range dst {
			for len(src) > 0 && src[0].ID <= r.ID {
				if r != src[0] {
					dst = append(dst, src[0])
				}
				src = src[1:]
			}
		}
		dst = append(dst, src...)
		sort.Slice(dst, func(i, j int) bool { return dst[i].ID < dst[j].ID })
		*dstp = dst
	}
	appendUnique(&c.repos, other.repos)
	appendUnique(&c.searched, other.searched)
	appendUnique(&c.indexed, other.indexed)
	appendUnique(&c.cloning, other.cloning)
	appendUnique(&c.missing, other.missing)
	appendUnique(&c.timedout, other.timedout)
	c.resultCount += other.resultCount

	if c.partial == nil {
		c.partial = make(map[api.RepoName]struct{})
	}

	for repo := range other.partial {
		c.partial[repo] = struct{}{}
	}
}
