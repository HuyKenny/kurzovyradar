import { describe, expect, it } from 'vitest';
import { addDays, daysOf, inDays } from '../src/lib/days';

const at = (iso: string) => Math.floor(Date.parse(iso) / 1000);

describe('Prague calendar days', () => {
  it('adds calendar days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('tomorrow is the next calendar day even when it has 25 hours (end of summer time 25. 10. 2026)', () => {
    const lateSaturday = at('2026-10-24T21:30:00Z'); // 23:30 in Prague (CEST), Sunday 25. 10. has 25 hours
    expect(daysOf('dnes', lateSaturday)).toEqual(['2026-10-24']);
    expect(daysOf('zitra', lateSaturday)).toEqual(['2026-10-25']);
    expect(inDays(at('2026-10-25T22:30:00Z'), 'zitra', lateSaturday)).toBe(true); // 23:30 CET the next day
    expect(inDays(at('2026-10-25T23:30:00Z'), 'zitra', lateSaturday)).toBe(false); // 00:30 on Monday
  });
  it('tomorrow after the spring change (29. 3. 2026 has 23 hours)', () => {
    const lateSaturday = at('2026-03-28T22:30:00Z'); // 23:30 CET
    expect(daysOf('zitra', lateSaturday)).toEqual(['2026-03-29']);
    expect(daysOf('7', lateSaturday)).toHaveLength(7);
    expect(daysOf('7', lateSaturday)[2]).toBe('2026-03-30');
  });
  it('the weekend is the coming Saturday and Sunday, and today counts on those days', () => {
    expect(daysOf('vikend', at('2026-10-22T10:00:00Z'))).toEqual(['2026-10-24', '2026-10-25']); // Thursday
    expect(daysOf('vikend', at('2026-10-25T10:00:00Z'))).toEqual(['2026-10-25']); // Sunday: only the rest of this weekend
    expect(daysOf('vikend', at('2026-10-24T10:00:00Z'))).toEqual(['2026-10-24', '2026-10-25']); // Saturday
  });
  it('a day is judged in Prague time, not UTC', () => {
    const t = at('2026-07-10T09:00:00Z');
    expect(inDays(at('2026-07-10T22:30:00Z'), 'dnes', t)).toBe(false); // 00:30 on 11. 7. in Prague
    expect(inDays(at('2026-07-10T21:30:00Z'), 'dnes', t)).toBe(true); // 23:30 on 10. 7.
  });
});
