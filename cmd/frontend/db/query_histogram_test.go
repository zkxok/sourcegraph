package db

import (
	"testing"

	"github.com/sourcegraph/sourcegraph/pkg/db/dbtesting"
)

func TestQueryHistogram_IncrementQuery(t *testing.T) {
	if testing.Short() {
		t.Skip()
	}
	ctx := dbtesting.TestContext(t)
	for _, q := range []string{"", "query"} {
		for i := 0; i < 5; i++ {
			n, err := QueryHistogram.Get(ctx, q)
			if err != nil {
				t.Fatalf("getting count for '%s': %v", q, err)
			}
			if n != i {
				t.Fatalf("histogram returned %d for %q, want %d", n, q, i)
			}
			if err := QueryHistogram.IncrementQuery(ctx, q); err != nil {
				t.Fatal(err)
			}
		}
	}
}

func BenchmarkQueryHistogram_IncrementQuery(b *testing.B) {
	ctx := dbtesting.TestContext(b)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if err := QueryHistogram.IncrementQuery(ctx, "query"); err != nil {
			b.Fatal(err)
		}
	}
}
