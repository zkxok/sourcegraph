package graphqlbackend

import "github.com/sourcegraph/sourcegraph/pkg/search"

type searchResultsResolver struct {
	results *search.SearchResults
}

type searchFilterResolver struct {
	filter *search.SearchFilter
}

func (sf *searchFilterResolver) Value() string {
	return sf.filter.Value
}

func (sf *searchFilterResolver) Label() string {
	return sf.filter.Label
}

func (sf *searchFilterResolver) Count() int32 {
	return sf.filter.Count
}

func (sf *searchFilterResolver) LimitHit() bool {
	return sf.filter.LimitHit
}

func (sf *searchFilterResolver) Kind() string {
	return sf.filter.Kind
}
