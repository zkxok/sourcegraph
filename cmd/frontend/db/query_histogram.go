package db

import (
	"context"
	"database/sql"
	"fmt"
	"github.com/sourcegraph/sourcegraph/pkg/db/dbconn"
)

type queryHistogram struct{}

// IncrementQuery increments the entry for the query q, or adds it as 1 if it was missing.
func (*queryHistogram) IncrementQuery(ctx context.Context, q string) error {
	sqlQuery := `
INSERT INTO query_histogram (query, count) VALUES ($1, 1)
ON CONFLICT (query) DO UPDATE SET count = query_histogram.count + 1;
`
	res, err := dbconn.Global.ExecContext(ctx, sqlQuery, q)
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

// Get returns entry in the db for the number of times the query q has been run,
// or 0 if there is no entry.
func (*queryHistogram) Get(ctx context.Context, q string) (int, error) {
	sqlQuery := `SELECT count FROM query_histogram WHERE query = $1;`
	row := dbconn.Global.QueryRowContext(ctx, sqlQuery, q)
	var i int
	if err := row.Scan(&i); err != nil {
		if err == sql.ErrNoRows {
			return 0, nil
		}
		return 0, fmt.Errorf("scanning row: %v", err)
	}
	return i, nil
}
