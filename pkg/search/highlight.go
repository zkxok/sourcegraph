package search

import "github.com/sourcegraph/sourcegraph/pkg/vcs/git"

type HighlightedRange struct {
	Line      int32
	Character int32
	Length    int32
}

type HighlightedString struct {
	Value      string
	Highlights []*HighlightedRange
}

func fromVCSHighlights(vcsHighlights []git.Highlight) []*HighlightedRange {
	highlights := make([]*highlightedRange, len(vcsHighlights))
	for i, vh := range vcsHighlights {
		highlights[i] = &HighlightedRange{
			line:      int32(vh.Line),
			character: int32(vh.Character),
			length:    int32(vh.Length),
		}
	}
	return highlights
}
