CREATE TABLE tasks (
 id TEXT PRIMARY KEY, project TEXT NOT NULL, title TEXT NOT NULL, detail TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'queued', summary TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, lease TEXT, lease_until INTEGER,
 version TEXT, pr_url TEXT, commit_sha TEXT, plan TEXT, review TEXT
);
CREATE INDEX task_queue ON tasks(state, created_at);
CREATE TABLE events (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT NOT NULL, state TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL);
CREATE TABLE control (id INTEGER PRIMARY KEY CHECK(id=1), paused INTEGER NOT NULL DEFAULT 0, heartbeat TEXT);
INSERT INTO control(id) VALUES(1);
