import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import type { Db, Stmt } from '../src/server/store/db';

/** In-memory SQLite with the D1 surface the server code uses, loaded with the real migrations. */
export function testDb(): Db & { raw: DatabaseSync } {
  const raw = new DatabaseSync(':memory:');
  const dir = new URL('../migrations/', import.meta.url);
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) raw.exec(readFileSync(new URL(f, dir), 'utf8'));
  const changes = () => Number((raw.prepare('SELECT changes() AS c').get() as { c: number }).c);
  const stmt = (sql: string, args: unknown[] = []): Stmt => {
    const a = () => args.map((v) => (typeof v === 'boolean' ? Number(v) : v === undefined ? null : v)) as never[];
    return {
      bind: (...v: unknown[]) => stmt(sql, v),
      first: async <T>() => (raw.prepare(sql).get(...a()) ?? null) as T | null,
      all: async <T>() => ({ results: raw.prepare(sql).all(...a()) as T[] }),
      run: async () => {
        raw.prepare(sql).all(...a());
        return { meta: { changes: changes() } };
      },
    };
  };
  return {
    raw,
    prepare: (sql) => stmt(sql),
    batch: async (list) => {
      raw.exec('BEGIN');
      try {
        const out = [];
        for (const s of list) {
          const r = await s.all();
          out.push({ results: r.results, meta: { rows_written: changes() } });
        }
        raw.exec('COMMIT');
        return out;
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  };
}
