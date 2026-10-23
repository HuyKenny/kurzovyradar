-- KurzovyRadar: normalized events, current offers, change history, import runs, derived snapshots.
-- Times are unix seconds (UTC). Odds are INTEGER thousandths (1.85 → 1850) so comparisons are exact.

-- Bookmaker states (odds feed / affiliate / review) are code-reviewed config: src/config/bookmakers.ts.
-- Runtime feed health is book_state below.

CREATE TABLE competitions (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('fotbal', 'hokej')),
  created_at INTEGER NOT NULL
);

-- Our own stable event id; source ids live in event_sources.
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('fotbal', 'hokej')),
  competition_id INTEGER NOT NULL REFERENCES competitions(id),
  home TEXT NOT NULL,
  away TEXT NOT NULL,
  start_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX events_start ON events(start_at);
CREATE INDEX events_comp_start ON events(competition_id, start_at);

CREATE TABLE event_sources (
  book TEXT NOT NULL,
  src_id TEXT NOT NULL,
  event_id INTEGER NOT NULL REFERENCES events(id),
  src_competition TEXT NOT NULL,
  home TEXT NOT NULL,
  away TEXT NOT NULL,
  start_at INTEGER NOT NULL,
  path TEXT NOT NULL DEFAULT '',
  -- 1 = this source no longer passes the pairing checks against the event (kept apart from comparison)
  mismatch INTEGER NOT NULL DEFAULT 0,
  removed_at INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (book, src_id)
) WITHOUT ROWID;
CREATE INDEX event_sources_event ON event_sources(event_id);

-- Current state of every outcome. Written only when the price or availability changes.
CREATE TABLE offers (
  event_id INTEGER NOT NULL REFERENCES events(id),
  book TEXT NOT NULL,
  market TEXT NOT NULL,                      -- '1x2' = result in regular time
  outcome TEXT NOT NULL CHECK (outcome IN ('1', 'x', '2')),
  odds INTEGER NOT NULL CHECK (odds > 1000),
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
  first_odds INTEGER NOT NULL,
  first_at INTEGER NOT NULL,
  min_odds INTEGER NOT NULL,
  min_at INTEGER NOT NULL,
  max_odds INTEGER NOT NULL,
  max_at INTEGER NOT NULL,
  changed_at INTEGER NOT NULL,
  src_ts INTEGER NOT NULL,                   -- fetch time of the response that wrote this row
  removed_at INTEGER,                        -- set once when the outcome disappears from the feed
  PRIMARY KEY (event_id, book, market, outcome)
) WITHOUT ROWID;
CREATE INDEX offers_changed ON offers(changed_at);

-- One row per recorded change (price or enabled flag). Same key = same record → idempotent.
CREATE TABLE odds_history (
  event_id INTEGER NOT NULL,
  book TEXT NOT NULL,
  market TEXT NOT NULL,
  outcome TEXT NOT NULL,
  at INTEGER NOT NULL,
  odds INTEGER NOT NULL,
  enabled INTEGER NOT NULL,
  PRIMARY KEY (event_id, book, market, outcome, at)
) WITHOUT ROWID;

CREATE TABLE import_runs (
  id INTEGER PRIMARY KEY,
  book TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  status TEXT NOT NULL CHECK (status IN ('running', 'ok', 'error')),
  matches_seen INTEGER NOT NULL DEFAULT 0,
  offers_changed INTEGER NOT NULL DEFAULT 0,
  rows_read INTEGER NOT NULL DEFAULT 0,
  rows_written INTEGER NOT NULL DEFAULT 0,
  error TEXT
);
CREATE INDEX import_runs_book ON import_runs(book, started_at);

CREATE TABLE book_state (
  book TEXT PRIMARY KEY,
  last_success_at INTEGER,                   -- fetch time of the last fully stored response
  last_attempt_at INTEGER,
  last_error TEXT,
  tracking_since INTEGER
);

-- Precomputed JSON for pages (one row read per page instead of scans).
CREATE TABLE derived (
  key TEXT PRIMARY KEY,
  json TEXT NOT NULL CHECK (json_valid(json)),
  at INTEGER NOT NULL
);
