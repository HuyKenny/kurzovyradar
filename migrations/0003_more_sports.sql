-- More sports and the two-way market ("Vítěz zápasu", outcomes 1 and 2 only).
-- competitions.sport and events.sport lose their CHECK (fotbal, hokej): SQLite cannot drop a CHECK, so both tables are rebuilt.
-- events gains `market` ('1x2' = three-way result in regular time, '12' = two-way winner); every existing event is '1x2'.
-- Foreign keys are deferred to the end of the migration (the parents are dropped and recreated under the same name).
PRAGMA defer_foreign_keys = on;

-- Copy, drop, recreate under the final names and refill by INSERT: the INSERTs into the parents are what settle the deferred
-- foreign-key violations of event_sources / offers (a plain RENAME of a new table would not).
CREATE TABLE competitions_bak AS SELECT * FROM competitions;
CREATE TABLE events_bak AS SELECT * FROM events;
DROP TABLE events;
DROP TABLE competitions;

CREATE TABLE competitions (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  sport TEXT NOT NULL,
  competition_id INTEGER NOT NULL REFERENCES competitions(id),
  home TEXT NOT NULL,
  away TEXT NOT NULL,
  start_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  market TEXT NOT NULL DEFAULT '1x2'
);
CREATE INDEX events_start ON events(start_at);
CREATE INDEX events_comp_start ON events(competition_id, start_at);

INSERT INTO competitions (id, slug, name, sport, created_at) SELECT id, slug, name, sport, created_at FROM competitions_bak;
INSERT INTO events (id, slug, sport, competition_id, home, away, start_at, created_at, updated_at)
  SELECT id, slug, sport, competition_id, home, away, start_at, created_at, updated_at FROM events_bak;
DROP TABLE events_bak;
DROP TABLE competitions_bak;
