package graphqlbackend

import "github.com/sourcegraph/sourcegraph/pkg/search"

type searchQueryDescriptionResolver struct {
	search.SearchQueryDescription
}

func (q searchQueryDescriptionResolver) Query() string { return q.Query }
func (q searchQueryDescriptionResolver) Description() *string {
	if q.Description == "" {
		return nil
	}
	return &q.Description
}

type searchAlertResolver struct {
	search.SearchAlert
}

func (a searchAlertResolver) Title() string { return a.Title }

func (a searchAlertResolver) Description() *string {
	if a.Description == "" {
		return nil
	}
	return &a.Description
}

func (a searchAlertResolver) ProposedQueries() *[]*SearchQueryDescription {
	if len(a.ProposedQueries) == 0 {
		return nil
	}
	return &a.ProposedQueries
}
