// Dry run over a saved real response (PROBE_DIR=…/probe pnpm vitest run tests/probe.test.ts); skipped otherwise.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { testDb } from './d1';
import { normalize } from '../src/server/run';
import { storeBook } from '../src/server/store/import';
import { derive } from '../src/server/store/derive';
import { settings } from '../src/server/types';

const dir = process.env.PROBE_DIR;
describe.skipIf(!dir)('real response dry run', () => {
  it('imports both books and pairs them', async () => {
    const db = testDb();
    const cfg = settings({});
    const now = Math.floor(Date.now() / 1000);
    for (const book of ['tipsport', 'chance'] as const) {
      const raw = JSON.parse(readFileSync(`${dir}/${book}-matches.json`, 'utf8')).matches;
      const t0 = performance.now();
      const r = normalize(book, raw, now + (book === 'chance' ? 1 : 0));
      const t1 = performance.now();
      const out = await storeBook(db, r, cfg, now);
      console.log(book, 'raw', raw.length, 'kept', r.matches.length, 'normalize ms', (t1 - t0).toFixed(1), 'store ms', (performance.now() - t1).toFixed(1),
        'queries', out.meter.queries, 'written', out.meter.written, 'changed', out.changed);
    }
    const d = await derive(db, cfg, now + 2);
    const q = (s: string) => db.raw.prepare(s).get();
    console.log('events', q('SELECT COUNT(*) n FROM events'), 'offers', q('SELECT COUNT(*) n FROM offers'), 'mismatch', q('SELECT COUNT(*) n FROM event_sources WHERE mismatch=1'),
      'single-book events', q('SELECT COUNT(*) n FROM (SELECT event_id FROM event_sources GROUP BY event_id HAVING COUNT(*)=1)'),
      'derive queries', d.meter.queries, 'json kB', Math.round((q("SELECT length(json) n FROM derived WHERE key='upcoming'") as { n: number }).n / 1024));
    console.log(db.raw.prepare('SELECT c.slug, COUNT(*) n FROM events e JOIN competitions c ON c.id=e.competition_id GROUP BY c.slug ORDER BY n DESC').all().map((r) => `${r.slug}:${r.n}`).join(' '));
    expect(d.events).toBeGreaterThan(0);
  });
});
