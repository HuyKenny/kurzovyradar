/**
 * Competitions that are not in the curated list (src/config/competitions.ts): created from the platform's own names so every
 * sport and league a visitor can bet on is covered. Pure.
 *  - the idSport name tells the variant: "Tenis ženy - čtyřhra" → women's doubles, "Lední hokej - junioři" → juniors
 *  - men's and women's leagues share a competition name on the platform, so the variant is part of the slug and the name
 *  - esports: the idSport name is the game ("Counter Strike"), the competition name is the tournament
 */
import { SPORTS, type Gender, type Sport } from '../../config/competitions';
import { slugify } from './participants';

export interface Variant { gender: Gender; label: string }

/** "Tenis muži - dvouhra" → men, no label; "Tenis ženy - čtyřhra" → women, "ženy, čtyřhra"; "Rugby union - muži" → "union". */
export function variantOf(sport: Sport, nameSport: string): Variant {
  let rest = nameSport.trim();
  for (const p of [...SPORTS[sport].prefix].sort((a, b) => b.length - a.length)) {
    if (rest.toLowerCase().startsWith(p.toLowerCase())) { rest = rest.slice(p.length); break; }
  }
  const parts = rest.split(/\s*[-–]\s*/).map((x) => x.trim()).filter(Boolean);
  const gender: Gender = parts.some((x) => x.toLowerCase() === 'ženy') ? 'zeny' : 'muzi';
  const kept = parts.filter((x) => !['muži', 'dvouhra'].includes(x.toLowerCase()));
  return { gender, label: kept.join(', ') };
}

export interface DynamicCompetition { slug: string; name: string; sport: Sport }

export function dynamicCompetition(sport: Sport, competitionName: string, nameSport: string): DynamicCompetition | null {
  const base = competitionName.trim();
  if (!base) return null;
  const v = variantOf(sport, nameSport);
  const esport = sport === 'esporty';
  const game = esport ? nameSport.trim() : '';
  const title = esport && game ? `${game}: ${base}` : base;
  const label = esport ? '' : v.label;
  const slug = `${sport}-${slugify(esport && game ? `${game} ${base}` : base)}${label ? `-${slugify(label)}` : ''}`.slice(0, 110).replace(/-+$/, '');
  return { slug, name: label ? `${title} (${label})` : title, sport };
}
