package search

import (
	"sort"

	"github.com/sourcegraph/sourcegraph/cmd/frontend/types"
	"github.com/sourcegraph/sourcegraph/pkg/api"
)

// SearchResultsCommon contains fields that should be returned by all funcs
// that contribute to the overall search result set.
type SearchResultsCommon struct {
	LimitHit bool                      // whether the limit on results was hit
	Repos    []*types.Repo             // repos that were matched by the repo-related filters
	Searched []*types.Repo             // repos that were searched
	Indexed  []*types.Repo             // repos that were searched using an index
	Cloning  []*types.Repo             // repos that could not be searched because they were still being cloned
	Missing  []*types.Repo             // repos that could not be searched because they do not exist
	Partial  map[api.RepoName]struct{} // repos that were searched, but have results that were not returned due to exceeded limits

	MaxResultsCount int32
	ResultCount     int32

	// timedout usually contains repos that haven't finished being fetched yet.
	// This should only happen for large repos and the searcher caches are
	// purged.
	Timedout []*types.Repo

	IndexUnavailable bool // True if indexed search is enabled but was not available during this search.
}

// update updates c with the other data, deduping as necessary. It modifies c but
// does not modify other.
func (c *SearchResultsCommon) update(other SearchResultsCommon) {
	c.LimitHit = c.LimitHit || other.LimitHit
	c.IndexUnavailable = c.IndexUnavailable || other.IndexUnavailable

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
	appendUnique(&c.Repos, other.Repos)
	appendUnique(&c.Searched, other.Searched)
	appendUnique(&c.Indexed, other.Indexed)
	appendUnique(&c.Cloning, other.Cloning)
	appendUnique(&c.Missing, other.Missing)
	appendUnique(&c.Timedout, other.Timedout)
	c.ResultCount += other.ResultCount

	if c.Partial == nil {
		c.Partial = make(map[api.RepoName]struct{})
	}

	for repo := range other.Partial {
		c.Partial[repo] = struct{}{}
	}
}
