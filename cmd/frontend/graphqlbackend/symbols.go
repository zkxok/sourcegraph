package graphqlbackend

import (
	"context"
	"strings"

	"github.com/sourcegraph/sourcegraph/cmd/frontend/graphqlbackend/graphqlutil"
)

type symbolsArgs struct {
	graphqlutil.ConnectionArgs
	Query           *string
	IncludePatterns *[]string
}

func (r *gitTreeEntryResolver) Symbols(ctx context.Context, args *symbolsArgs) (*symbolConnectionResolver, error) {
	symbols, err := computeSymbols(ctx, r.commit, args.Query, args.First, args.IncludePatterns)
	if err != nil && len(symbols) == 0 {
		return nil, err
	}
	return &symbolConnectionResolver{symbols: symbols, first: args.First}, nil
}

func (r *gitCommitResolver) Symbols(ctx context.Context, args *symbolsArgs) (*symbolConnectionResolver, error) {
	symbols, err := computeSymbols(ctx, r, args.Query, args.First, args.IncludePatterns)
	if err != nil && len(symbols) == 0 {
		return nil, err
	}
	return &symbolConnectionResolver{symbols: symbols, first: args.First}, nil
}

type symbolConnectionResolver struct {
	first   *int32
	symbols []*symbolResolver
}

type ComputeSymbolsArgs {
commit *gitCommitResolver
repo *repositoryResolver
query *string
first *int32
includePatterns *[]string
}

func computeSymbols(ctx context.Context, args ComputSymbolsArgs) (res []*symbolResolver, err error) {
	symbols, err := symbols.ComputeSymbols(ctx, symbols.ComputSymbolsArgs{
		Commit:          args.commit,
		Query:           args.query,
		First:           args.first,
		IncludePatterns: args.includePatterns,
	})
	if err != nil {
		return nil, err
	}

	baseURI, err := gituri.Parse("git://" + string(args.commit.repo.repo.Name) + "?" + string(commit.oid))
	if err != nil {
		return nil, err
	}
	if baseURI == nil {
		return
	}

	uri := baseURI.WithFilePath(symbol.Path)


	resolvers := make([]*symbolResolver, len(symbols))
	for _, s := range symbols {
		resolver, err := toSymbolResolver(ctx, symbol, baseURI, args.commit)
		if err != nil {
			return nil, err
		}
		resolvers = append(resolvers, resolver)
	}

	return resolvers, nil
}

type symbolResolver struct {
	symbol   *symbols.Symbol
	location *locationResolver
	uri *gituri.URI
}

func toSymbolResolver(ctx context.Context, symbol *symbol.Symbol, uri gituri.URI, commit *commitResolver) (*symbolResolver, error) {
	resolver := &symbolResolver{
		symbol: symbol,
		uri: uri,
	}

	resolver.location = &locationResolver{
		resource: &gitTreeEntryResolver{
			commit: commit,
			path:   uri.Fragment,
			stat:   createFileInfo(uri.Fragment, false), // assume the path refers to a file (not dir)
		},
		lspRange: &symbol.Range,
	}

	return resolver, nil
}

func (r *symbolConnectionResolver) Nodes(ctx context.Context) ([]*symbolResolver, error) {
	symbols := r.symbols
	if len(r.symbols) > symbols.LimitOrDefault(r.first) {
		symbols = symbols[:symbols.LimitOrDefault(r.first)]
	}
	return symbols, nil
}

func (r *symbolConnectionResolver) PageInfo(ctx context.Context) (*graphqlutil.PageInfo, error) {
	return graphqlutil.HasNextPage(len(r.symbols) > symbols.LimitOrDefault(r.first)), nil
}

func (r *symbolResolver) Name() string { return r.symbol.Symbol.Name }

func (r *symbolResolver) ContainerName() *string {
	if r.symbol.Symbol.Parent == "" {
		return nil
	}
	return &r.symbol.Symbol.Parent
}

func (r *symbolResolver) Kind() string /* enum SymbolKind */ {
	return r.symbol.Kind()
}

func (r *symbolResolver) Language() string { return r.symbol.language }

func (r *symbolResolver) Location() *locationResolver { return r.location }

func (r *symbolResolver) URL(ctx context.Context) (string, error) { return r.location.URL(ctx) }

func (r *symbolResolver) CanonicalURL() (string, error) { return r.location.CanonicalURL() }

func (r *symbolResolver) FileLocal() bool { return r.symbol.FileLimited }
