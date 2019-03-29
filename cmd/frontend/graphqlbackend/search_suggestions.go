package graphqlbackend

import (
	"context"

	"github.com/sourcegraph/sourcegraph/pkg/api"
	"github.com/sourcegraph/sourcegraph/pkg/gituri"
	"github.com/sourcegraph/sourcegraph/pkg/search"
	"github.com/sourcegraph/sourcegraph/pkg/vcs/git"
)

type searchSuggestionResolver struct {
	search.SearchSuggestion
}

func (r *searchSuggestionResolver) ToRepository() (*repositoryResolver, bool) {
	if r.Repo == nil {
		return nil, false
	}
	return &repositoryResolver{repo: repo}, true
}
func (r *searchSuggestionResolver) ToFileMatch() (*fileMatchResolver, bool) {
	if r.FileMatch == nil {
		return nil, false
	}
	return &fileMatchResolver{fm: r.FileMatch}, true
}
func (r *searchSuggestionResolver) ToCommitSearchResult() (*commitSearchResultResolver, bool) {
	if r.Diff == nil {
		return nil, false
	}
	return &commitSearchResultResolver{cr: r.Diff}, false
}

/*
type SearchSuggestion struct {
	Repo      *types.Repo
	FileMatch *FileMatch
	Symbol    *symbols.Symbol

	// Score defines how well this item matches the query for sorting purposes
	Score int
	// Length holds the length of the item name as a second sorting criterium
	Length int
	// Label to sort alphabetically by when all else is equal.
	Label string
}
*/

func toGitTreeEntryResolverFromFileMatch(ctx context.Context, fm *search.FileMatch) (*gitTreeEntryResolver, error) {
	commit, err := backend.GetCommit(ctx, fm.Repo, fm.CommitID)
	if err != nil {
		return nil, err
	}
	cachedRepo, err := backend.CachedGitRepo(ctx, fm.Repo)
	if err != nil {
		return nil, err
	}
	stat, err := git.Stat(ctx, *cachedRepo, api.CommitID(oid), fm.JPath)
	if err != nil {
		return nil, err
	}
	return &gitTreeEntryResolver{
		commit: toGitCommitResolver(repositoryResolver{repo: fm.Repo}, commit),
		path:   fm.JPath,
		stat:   stat,
	}
}

func (r *searchSuggestionResolver) ToFile() (*gitTreeEntryResolver, bool) {
	if r.FileMatch == nil {
		return nil, false
	}
	ctx := context.Background()
	return toGitTreeEntryResolverFromFileMatch(ctx, r.FileMatch), true
}

func (r *searchSuggestionResolver) ToGitBlob() (*gitTreeEntryResolver, bool) {
	if r.FileMatch == nil {
		return nil, false
	}
	ctx := context.Background()
	return toGitTreeEntryResolverFromFileMatch(ctx, r.FileMatch), true
}

func (r *searchSuggestionResolver) ToGitTree() (*gitTreeEntryResolver, bool) {
	if r.FileMatch == nil {
		return nil, false
	}
	ctx := context.Background()
	return toGitTreeEntryResolverFromFileMatch(ctx, r.FileMatch), true
}

func (r *searchSuggestionResolver) ToSymbol() (*symbolResolver, bool) {
	if r.Symbol == nil {
		return nil, false
	}

	ctx := context.Background()

	// TODO: Figure out how to get the URI into the actual symbol so we don't have to deal with this shit.
	baseURI, err := gituri.Parse("git://" + string(args.commit.repo.repo.Name) + "?" + string(commit.oid))
	if err != nil {
		return nil, err
	}
	if baseURI == nil {
		return nil, false
	}

	toGitCommitResolver(repositoryResolver{repo: fm.Repo}, commit)
	// func toSymbolResolver(ctx context.Context, symbol *symbol.Symbol, uri gituri.URI, commit *commitResolver) (*symbolResolver, error) {
	symbol := toSymbolResolver(ctx, r.Symbol, baseURI)

	return
}
