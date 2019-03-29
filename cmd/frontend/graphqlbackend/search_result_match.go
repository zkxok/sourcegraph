package graphqlbackend

import "github.com/sourcegraph/sourcegraph/pkg/search"

// A resolver for the GraphQL type GenericSearchMatch
type searchResultMatchResolver struct {
	match *search.SearchResultMatch
}

func (m *searchResultMatchResolver) URL() string {
	return m.match.url
}

func (m *searchResultMatchResolver) Body() *markdownResolver {
	return &markdownResolver{text: m.match.body}
}

func (m *searchResultMatchResolver) Highlights() []*highlightedRangeResolver {
	return toHighlightedRangeResolvers(r.match.Highlights)
}

type highlightedRangeResolver struct {
	hr search.HighlightedRange
}

func (h *highlightedRangeResolver) Line() int32      { return h.hr.Line }
func (h *highlightedRangeResolver) Character() int32 { return h.hr.Character }
func (h *highlightedRangeResolver) Length() int32    { return h.hr.Length }

type highlightedStringResolver struct {
	hs search.HighlightedString
}

func (r *highlightedStringResolver) Value() string { return r.Value }
func (r *highlightedStringResolver) Highlights() []*highlightedRangeResolver {
	return toHighlightedRangeResolvers(r.hs.Highlights)
}

func toHighlightedRangeResolvers(hrs []*search.HighlightedRange) []*highlightedRangeResolver {
	hls := make([]*highlightedRangeResolver, len(hrs.Highlights))
	for _, h := range r.hs.Highlights {
		hls := append(hls, h)
	}
	return hls
}
