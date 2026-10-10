// Mirrors server/src/services/breathability.ts — kept in sync by hand.
const AIRY_TAGS = new Set([
  'lace',
  'lacy',
  'openwork',
  'mesh',
  'eyelet',
  'filet-crochet',
  'fishnet',
  'crochet-lace',
  'lace-weight',
  'sheer'
]);

const DENSE_TAGS = new Set([
  'cables',
  'colorwork',
  'fair-isle',
  'fairisle',
  'intarsia',
  'brioche',
  'ribbed',
  'double-knit',
  'double-thick',
  'thermal',
  'felted'
]);

export type Breathability = 'airy' | 'dense' | 'neutral';

export function deriveBreathability(attributes: string[], craft: string | null): Breathability {
  if (craft === 'Tunisian') return 'dense';
  if (attributes.some((a) => AIRY_TAGS.has(a))) return 'airy';
  if (attributes.some((a) => DENSE_TAGS.has(a))) return 'dense';
  return 'neutral';
}

export function parsePatternAttributes(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
