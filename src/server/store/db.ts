/** The slice of D1 we use, so tests can run the same code on node:sqlite (tests/d1.ts). */
export interface Stmt {
  bind(...values: unknown[]): Stmt;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; meta?: { rows_read?: number; rows_written?: number } }>;
  run(): Promise<{ meta: { changes?: number; rows_read?: number; rows_written?: number } }>;
}
export interface Db {
  prepare(sql: string): Stmt;
  batch(stmts: Stmt[]): Promise<{ results?: unknown[]; meta?: { rows_read?: number; rows_written?: number } }[]>;
}

/** D1 allows 100 bound parameters per statement: multi-row INSERTs are cut to fit. */
export const MAX_PARAMS = 100;

export function multiInsert(db: Db, head: string, cols: number, rows: unknown[][], tail = ''): Stmt[] {
  const per = Math.max(1, Math.floor(MAX_PARAMS / cols));
  const out: Stmt[] = [];
  const one = `(${Array(cols).fill('?').join(',')})`;
  for (let i = 0; i < rows.length; i += per) {
    const chunk = rows.slice(i, i + per);
    out.push(db.prepare(`${head} VALUES ${chunk.map(() => one).join(',')} ${tail}`).bind(...chunk.flat()));
  }
  return out;
}

/** Usage counters for the run log and the capacity report. */
export class Meter {
  read = 0;
  written = 0;
  queries = 0;
  add(meta: { rows_read?: number; rows_written?: number } | undefined) {
    this.queries++;
    this.read += meta?.rows_read ?? 0;
    this.written += meta?.rows_written ?? 0;
  }
  async all<T>(s: Stmt): Promise<T[]> {
    const r = await s.all<T>();
    this.add(r.meta);
    return r.results;
  }
  /** Runs statements in batches (each batch is one transaction in D1). */
  async batch(db: Db, stmts: Stmt[], size = 50): Promise<void> {
    for (let i = 0; i < stmts.length; i += size) {
      const res = await db.batch(stmts.slice(i, i + size));
      for (const r of res) this.add(r.meta);
    }
  }
}
