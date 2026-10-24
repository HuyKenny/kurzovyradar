import { describe, it, expect } from 'vitest';
import { COMPETITIONS } from '../src/config/competitions';
import { ON_SPORTSTREAMY, ON_ZIVEPRENOSY } from '../src/config/sister';

describe('sister-site links', () => {
  const slugs = new Set([...COMPETITIONS.map((c) => c.slug), 'basketbal-nba', 'americky-fotbal-nfl', 'bojove-sporty-clash', 'hokej-ahl']);
  it('only point from competitions we curate, to a path of the expected shape', () => {
    for (const [k, v] of Object.entries(ON_SPORTSTREAMY)) { expect(slugs.has(k), k).toBe(true); expect(v).toMatch(/^\/(fotbal|hokej|basketbal|americky-fotbal|bojove-sporty)-online\/[a-z0-9-]+\/$/); }
    for (const [k, v] of Object.entries(ON_ZIVEPRENOSY)) { expect(slugs.has(k), k).toBe(true); expect(v).toMatch(/^\/(futbal|hokej)\/[a-z0-9-]+\/$/); }
  });
  it('are kept few: one contextual link per competition page', () => {
    expect(Object.keys(ON_ZIVEPRENOSY).length).toBeLessThanOrEqual(3);
  });
});
