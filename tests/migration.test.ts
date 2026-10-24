import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dir = new URL('../migrations/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const sql = (f: string) => readFileSync(new URL(f, dir), 'utf8');

describe('migration 0003 keeps the data and the links between tables', () => {
  it('rebuilds events and competitions with foreign keys ON, nothing lost, new sports and markets allowed', () => {
    const db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON');
    for (const f of files.filter((x) => x < '0003')) db.exec(sql(f));
    db.exec("INSERT INTO competitions (id, slug, name, sport, created_at) VALUES (1, 'premier-league', 'Premier League', 'fotbal', 1), (2, 'nhl', 'NHL', 'hokej', 1)");
    db.exec("INSERT INTO events (id, slug, sport, competition_id, home, away, start_at, created_at, updated_at) VALUES (10, 'a-b', 'fotbal', 1, 'A', 'B', 100, 1, 1), (11, 'c-d', 'hokej', 2, 'C', 'D', 200, 1, 1)");
    db.exec("INSERT INTO event_sources (book, src_id, event_id, src_competition, home, away, start_at, updated_at) VALUES ('tipsport', '5', 10, 'x', 'A', 'B', 100, 1)");
    db.exec("INSERT INTO offers (event_id, book, market, outcome, odds, enabled, first_odds, first_at, min_odds, min_at, max_odds, max_at, changed_at, src_ts) VALUES (10, 'tipsport', '1x2', '1', 2000, 1, 2000, 1, 2000, 1, 2000, 1, 1, 1)");
    // D1 runs a migration file as one transaction (that is what makes defer_foreign_keys work); emulate it
    db.exec('BEGIN');
    db.exec(sql('0003_more_sports.sql'));
    db.exec('COMMIT');
    expect(db.prepare('SELECT COUNT(*) n FROM events').get()).toEqual({ n: 2 });
    expect(db.prepare('SELECT COUNT(*) n FROM competitions').get()).toEqual({ n: 2 });
    expect(db.prepare('SELECT market FROM events WHERE id = 10').get()).toEqual({ market: '1x2' });
    expect(db.prepare('SELECT COUNT(*) n FROM offers o JOIN events e ON e.id = o.event_id').get()).toEqual({ n: 1 });
    expect(db.prepare('SELECT COUNT(*) n FROM event_sources s JOIN events e ON e.id = s.event_id').get()).toEqual({ n: 1 });
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    // new sport, two-way market, indexes kept
    db.exec("INSERT INTO competitions (slug, name, sport, created_at) VALUES ('tenis-wta-tokyo', 'WTA Tokyo', 'tenis', 1)");
    db.exec("INSERT INTO events (slug, sport, competition_id, home, away, start_at, created_at, updated_at, market) VALUES ('a-b', 'tenis', 3, 'A', 'B', 300, 1, 1, '12')");
    expect(db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'events_%' ORDER BY name").all()).toEqual([{ name: 'events_comp_start' }, { name: 'events_start' }]);
    // the foreign key from events to competitions still protects
    expect(() => db.exec("INSERT INTO events (slug, sport, competition_id, home, away, start_at, created_at, updated_at) VALUES ('x', 'tenis', 999, 'A', 'B', 1, 1, 1)")).toThrow();
  });
});
