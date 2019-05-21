BEGIN;

ALTER TABLE discussion_threads ADD COLUMN settings text;
ALTER TABLE discussion_threads ADD COLUMN is_check boolean NOT NULL DEFAULT false;
ALTER TABLE discussion_threads ADD COLUMN is_active boolean NOT NULL DEFAULT false;

ALTER TABLE discussion_threads_target_repo ADD COLUMN is_ignored boolean NOT NULL DEFAULT false;

COMMIT;
