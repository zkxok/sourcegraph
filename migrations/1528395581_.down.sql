BEGIN;

DROP TABLE IF EXISTS labels_objects;
DROP TABLE IF EXISTS labels;

ALTER TABLE discussion_threads_target_repo DROP COLUMN is_ignored;

ALTER TABLE discussion_threads DROP COLUMN settings;
ALTER TABLE discussion_threads DROP COLUMN is_check;
ALTER TABLE discussion_threads DROP COLUMN is_active;

COMMIT;
