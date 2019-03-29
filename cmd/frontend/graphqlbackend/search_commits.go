package graphqlbackend

import "github.com/sourcegraph/sourcegraph/pkg/search"

// commitSearchResultResolver is a resolver for the GraphQL type `CommitSearchResult`
type commitSearchResultResolver struct {
	cr search.CommitSearchResult
}

func (r *commitSearchResultResolver) Commit() *gitCommitResolver {
	return toGitCommitResolver(&repositoryResolver{repo: repo}, &r.cr.Commit)
}
func (r *commitSearchResultResolver) Refs() []*gitRefResolver            { return r.cr.Refs }
func (r *commitSearchResultResolver) SourceRefs() []*gitRefResolver      { return r.cr.SourceRefs }
func (r *commitSearchResultResolver) MessagePreview() *highlightedString { return r.cr.MessagePreview }
func (r *commitSearchResultResolver) DiffPreview() *highlightedString    { return r.cr.DiffPreview }
func (r *commitSearchResultResolver) Icon() string {
	return r.cr.Icon
}
func (r *commitSearchResultResolver) Label() *markdownResolver {
	return &markdownResolver{text: r.cr.Label}
}

func (r *commitSearchResultResolver) URL() string {
	return r.cr.URL
}

func (r *commitSearchResultResolver) Detail() *markdownResolver {
	return &markdownResolver{text: r.cr.Detail}
}

func (r *commitSearchResultResolver) Matches() []*searchResultMatchResolver {
	matches := make([]*searchResultMatchResolver, len(r.cr.Matches))
	for _, m := range r.cr.Matches {
		matches = append(matches, m)
	}
	return matches
}
