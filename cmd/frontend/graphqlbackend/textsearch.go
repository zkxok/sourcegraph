package graphqlbackend

import (
	"github.com/sourcegraph/sourcegraph/pkg/search"
)

type fileMatchResolver struct {
	fm *search.fileMatchResolver
}

func (fm *fileMatchResolver) Key() string {
	return fm.uri
}

func (fm *fileMatchResolver) File() *gitTreeEntryResolver {
	// NOTE(sqs): Omits other commit fields to avoid needing to fetch them
	// (which would make it slow). This gitCommitResolver will return empty
	// values for all other fields.
	return &gitTreeEntryResolver{
		commit: &gitCommitResolver{
			repo:     &repositoryResolver{repo: fm.fm.Repo},
			oid:      gitObjectID(fm.fm.CommitID),
			inputRev: fm.fm.InputRev,
		},
		path: fm.fm.JPath,
		stat: createFileInfo(fm.fm.JPath, false),
	}
}

func (fm *fileMatchResolver) Repository() *repositoryResolver {
	return &repositoryResolver{repo: fm.fm.Repo}
}

func (fm *fileMatchResolver) Resource() string {
	return fm.fm.URI
}

func (fm *fileMatchResolver) Symbols() []*symbolResolver {
	return fm.fm.Symbols
}

func (fm *fileMatchResolver) LineMatches() []*lineMatch {
	lmResolvers := make([]*lineMatch, len(fm.fm.JLineMatches))
	for _, lm := range fm.fm.JLineMatches {
		lmResolvers = append(lmResolvers, lm)
	}

	return lmResolvers
}

func (fm *fileMatchResolver) LimitHit() bool {
	return fm.fm.JLimitHit
}

type lineMatchResolver struct {
	lm *search.LineMatch
}

func (lm *lineMatchResolver) Preview() string {
	return lm.lm.JPreview
}

func (lm *lineMatchResolver) LineNumber() int32 {
	return lm.lm.JLineNumber
}

func (lm *lineMatchResolver) OffsetAndLengths() [][]int32 {
	r := make([][]int32, len(lm.JOffsetAndLengths))
	for i := range lm.lm.JOffsetAndLengths {
		r[i] = lm.lm.JOffsetAndLengths[i][:]
	}
	return r
}

func (lm *lineMatchResolver) LimitHit() bool {
	return lm.lm.JLimitHit
}
