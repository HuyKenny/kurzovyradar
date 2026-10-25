import { describe, expect, it } from 'vitest';
import { betTarget, outcomeLabel, outcomeSentence, payoutSentence, settlement, winCondition } from '../src/lib/market';
import { whoOf } from '../src/lib/ticket';

describe('market wording', () => {
  it('hockey draw is "Remíza po 60 minutách"', () => {
    expect(outcomeLabel('hokej', 'x', 'Sparta', 'Kladno')).toBe('Remíza po 60 minutách');
    expect(whoOf({ home: 'Sparta', away: 'Kladno', sport: 'hokej' }, 'x')).toBe('Remíza po 60 minutách');
    expect(betTarget('hokej', 'x', 'Sparta', 'Kladno')).toBe('remízu po 60 minutách');
    expect(outcomeLabel('fotbal', 'x', 'A', 'B')).toBe('Remíza');
  });
  it('outcomes as sentences with the settlement period', () => {
    expect(outcomeSentence('fotbal', '1', 'Arsenal', 'Everton')).toBe('Tým Arsenal vyhraje po 90 minutách a nastavení.');
    expect(outcomeSentence('hokej', 'x', 'Sparta', 'Kladno')).toBe('Remíza po 60 minutách: po třech třetinách bude stav nerozhodný.');
    expect(betTarget('fotbal', '2', 'Arsenal', 'Modří lvi')).toBe('výhru týmu Modří lvi');
    expect(settlement('hokej')).toBe('Platí stav po 60 minutách. Prodloužení ani nájezdy se nepočítají.');
    expect(settlement('fotbal')).toBe('Platí stav po 90 minutách a nastavení. Prodloužení ani penalty se nepočítají.');
  });
  it('win condition names the overtime trap', () => {
    expect(winCondition('hokej', '1', 'Sparta', 'Kladno')[1]).toContain('v prodloužení nebo na nájezdy, tahle sázka prohrává');
    expect(winCondition('hokej', 'x', 'Sparta', 'Kladno')[1]).toContain('sázka na remízu vyhrává');
  });
  it('payout is conditional and separates payout and profit', () => {
    expect(payoutSentence(100, 2100)).toBe('Pokud sázka vyhraje, ze 100 Kč dostaneš 210 Kč včetně vkladu. Čistý zisk je 110 Kč.');
    expect(payoutSentence(150, 1850)).toBe('Pokud sázka vyhraje, ze 150 Kč dostaneš 277,5 Kč včetně vkladu. Čistý zisk je 127,5 Kč.');
  });
});

describe('listing explanation follows the markets in the listing', () => {
  it('a two-way listing never explains a draw; a three-way one does; mixed says both', async () => {
    const { marketsRule } = await import('../src/lib/market');
    expect(marketsRule(new Set(['12']), 'tenis')).not.toMatch(/remíza je možn|vyhrává sázka na remízu/);
    expect(marketsRule(new Set(['12']))).toContain('Remíza tu není');
    expect(marketsRule(new Set(['1x2']), 'fotbal')).toContain('90 minutách');
    expect(marketsRule(new Set(['1x2', '12']))).toContain('vítěze');
    expect(marketsRule(new Set())).toBe('');
  });
});
