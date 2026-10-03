// Normalizes any weight label (sheet labels like "3 - DK"/"4 - Aran", or
// Ravelry's yarn_weight.name like "Worsted"/"DK"/"Fingering") down to a
// single 0-6 CYC bucket, since the two sources never agree on text but do
// agree on where a yarn actually sits on the thin-to-thick scale. Matching
// projects to yarns is done on this number, not the label.
const RAVELRY_NAME_TO_CLASS: Record<string, number> = {
  thread: 0,
  lace: 0,
  'light fingering': 1,
  fingering: 1,
  sock: 1,
  sport: 2,
  dk: 3,
  worsted: 4,
  aran: 4,
  bulky: 5,
  'super bulky': 6,
  jumbo: 6
};

export function classFromRavelryName(name: string | null | undefined): number | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  return RAVELRY_NAME_TO_CLASS[key] ?? null;
}

// Sheet labels are formatted "<digit> - <text>", e.g. "3 - DK" or "4 - Aran".
// The leading digit is already a CYC-ish bucket, so just read it off.
export function classFromSheetLabel(label: string | null | undefined): number | null {
  if (!label) return null;
  const match = label.trim().match(/^(\d)/);
  if (!match) return null;
  return Number(match[1]);
}

export const WEIGHT_CLASS_NAMES: Record<number, string> = {
  0: 'Lace',
  1: 'Fingering',
  2: 'Sport',
  3: 'DK',
  4: 'Worsted/Aran',
  5: 'Bulky',
  6: 'Super Bulky'
};
