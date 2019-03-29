package search

// SearchResultMatch is a generic search result match.
type SearchResultMatch struct {
	url        string
	body       string
	highlights []*HighlightedRange
}
