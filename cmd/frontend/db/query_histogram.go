package db

import (
	"context"
	"fmt"

	"github.com/sourcegraph/sourcegraph/pkg/db/dbconn"
)

type queryHistogram struct{}

// IncrementQuery increments the entry for the query q, or adds it as 1 if it was missing.
func (*queryHistogram) IncrementQuery(ctx context.Context, q string) error {
	sql := `
INSERT INTO query_histogram (query, count) VALUES ($1, 1)
ON CONFLICT (query)
  
`
	res, err := dbconn.Global.ExecContext(ctx, sql, q)
	if err != nil {
		return err
	}
	nrows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if nrows == 0 {
		return fmt.Errorf("query histogram update for '%s' failed to affect any rows", q)
	}
	return nil
}
