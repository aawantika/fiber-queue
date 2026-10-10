// Mirrors web/src/breathability.ts — kept in sync by hand. Derived from
// Ravelry's pattern_attributes tags (open-stitch techniques vs.
// gap-free/insulating ones) plus craft (Tunisian fabric has no gaps
// regardless of tags). Heuristic, not authoritative — shown alongside the
// raw tags so a wrong guess is easy to spot and the tags are always there
// as ground truth.
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
