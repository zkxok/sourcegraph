package graphqlbackend

import (
	"context"

	"github.com/sourcegraph/sourcegraph/pkg/search"
)

func (r *schemaResolver) Search(args *struct {
	Query string
}) (searchResolver, error) {
	searcher := search.Search(args.Query)

}

type searchResolver struct {
	searcher *search.Searcher
}

// type  interface {
// Results(context.Context) (*searchResultsResolver, error)
// Suggestions(context.Context, *searchSuggestionsArgs) ([]*searchSuggestionResolver, error)
// //lint:ignore U1000 is used by graphql via reflection
// Stats(context.Context) (*searchResultsStats, error)
// }

func (r *searchResolver) Results(ctx context.Context) (*searchResultsResolver, error) {
	results, err := r.searcher.Results(ctx)
	if err != nil {
		return nil, err
	}

	return &searchResultsResolver{
		results: results,
	}, err
}

func (r *searchresolver) suggestions(ctx context.context, args *struct {
	First *int32
}) ([]*searchresultsresolver, error) {
	return nil, nil
}
