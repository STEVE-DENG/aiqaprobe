ALTER TABLE tasks ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0 CHECK(is_public IN (0,1));
UPDATE tasks SET is_public=1 WHERE EXISTS(SELECT 1 FROM events WHERE events.task_id=tasks.id AND events.state='planning');
CREATE INDEX public_tasks ON tasks(is_public, updated_at);
