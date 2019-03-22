BEGIN;

CREATE TABLE "query_histogram" (
	"id" serial NOT NULL PRIMARY KEY,
	"query" text NOT NULL UNIQUE,
	-- how many times query has been run since this table was created
	"count" integer NOT NULL
);

COMMIT;
