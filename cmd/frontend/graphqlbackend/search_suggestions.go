package graphqlbackend

type searchSuggestionResolver struct {
	s *search.SearchSuggestion
}

func (r *searchSuggestionResolver) ToRepository() (*repositoryResolver, bool) {
	repo, ok := r.s.Repo
	return &repositoryResolver{repo: repo}, ok
}
