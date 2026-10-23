/** Display form of a participant: the platform marks women's teams with a trailing " Ž". */
export function displayName(s: string): string {
  return s.trim().replace(/\s+/g, ' ').replace(/\sŽ$/, ' (ž)');
}

/** Comparison key: case, accents, punctuation and spacing do not matter; the women's marker does. */
export function participantKey(s: string): string {
  return displayName(s)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}()]+/gu, ' ')
    .trim();
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const eventSlug = (home: string, away: string) => slugify(`${home} ${away}`) || 'zapas';
