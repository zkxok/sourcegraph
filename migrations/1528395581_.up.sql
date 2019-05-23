BEGIN;

ALTER TABLE discussion_threads ADD COLUMN settings text;
ALTER TABLE discussion_threads ADD COLUMN is_check boolean NOT NULL DEFAULT false;
ALTER TABLE discussion_threads ADD COLUMN is_active boolean NOT NULL DEFAULT false;

ALTER TABLE discussion_threads_target_repo ADD COLUMN is_ignored boolean NOT NULL DEFAULT false;

CREATE TABLE labels (
       id bigserial PRIMARY KEY,
       project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
       name citext NOT NULL,
       description text,
       color text NOT NULL
);
CREATE INDEX labels_name ON labels(name);
CREATE INDEX labels_project_id ON labels(project_id);
CREATE UNIQUE INDEX labels_name_project_uniq ON labels(name, project_id);

CREATE TABLE labels_objects (
       label_id bigint NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
       thread_id bigint REFERENCES discussion_threads(id) ON DELETE CASCADE
);
CREATE INDEX labels_objects_label_id ON labels_objects(label_id);
CREATE INDEX labels_objects_thread_id ON labels_objects(thread_id) WHERE thread_id IS NOT NULL;
CREATE UNIQUE INDEX labels_objects_uniq ON labels_objects(label_id, thread_id);

COMMIT;
