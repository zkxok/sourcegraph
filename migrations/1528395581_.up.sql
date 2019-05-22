BEGIN;

ALTER TABLE discussion_threads ADD COLUMN settings text;
ALTER TABLE discussion_threads ADD COLUMN is_check boolean NOT NULL DEFAULT false;
ALTER TABLE discussion_threads ADD COLUMN is_active boolean NOT NULL DEFAULT false;

ALTER TABLE discussion_threads_target_repo ADD COLUMN is_ignored boolean NOT NULL DEFAULT false;

CREATE TABLE labels (
       id bigserial PRIMARY KEY,
       owner_org_id integer REFERENCES orgs(id) ON DELETE CASCADE,
       name citext NOT NULL,
       description text,
       color text NOT NULL
);
CREATE INDEX labels_name ON labels(name);
CREATE INDEX labels_owner_org_id ON labels(owner_org_id);
CREATE UNIQUE INDEX labels_name_owner_uniq ON labels(name, owner_org_id);

CREATE TABLE labels_objects (
       label_id bigint NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
       thread_id bigint REFERENCES discussion_threads(id) ON DELETE CASCADE
);
CREATE INDEX labels_objects_label_id ON labels_objects(label_id);
CREATE INDEX labels_objects_thread_id ON labels_objects(thread_id) WHERE thread_id IS NOT NULL;
CREATE UNIQUE INDEX labels_objects_uniq ON labels_objects(label_id, thread_id);

COMMIT;
