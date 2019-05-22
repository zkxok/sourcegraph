package labels

import (
	"context"
	"database/sql"
)

type dbh interface {
	QueryRowContext(context.Context, string, ...interface{}) *sql.Row
	ExecContext(context.Context, string, ...interface{}) (sql.Result, error)
}
