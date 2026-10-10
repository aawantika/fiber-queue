import { db } from './client.js';

export interface YarnInput {
  brand: string;
  colorName: string | null;
  color: string | null;
  weightLabel: string | null;
  weightClass: number | null;
  fiber: string | null;
  yardsPerGram: number | null;
  grams: number | null;
  yards: number | null;
  sourceUrl: string | null;
}

export interface Yarn extends YarnInput {
  id: number;
  createdAt: string;
  updatedAt: string;
}

function rowToYarn(row: any): Yarn {
  return {
    id: row.id,
    brand: row.brand,
    colorName: row.color_name,
    color: row.color,
    weightLabel: row.weight_label,
    weightClass: row.weight_class,
    fiber: row.fiber,
    yardsPerGram: row.yards_per_gram,
    grams: row.grams,
    yards: row.yards,
    sourceUrl: row.source_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const WEIGHT_SORT_SQL = `
  CASE WHEN weight_class IS NULL THEN 1 ELSE 0 END, weight_class,
  brand COLLATE NOCASE, color_name COLLATE NOCASE
`;

export function listYarns(): Yarn[] {
  const rows = db.prepare(`SELECT * FROM yarns ORDER BY ${WEIGHT_SORT_SQL}`).all();
  return rows.map(rowToYarn);
}

export function listYarnsByWeightClass(weightClass: number): Yarn[] {
  const rows = db
    .prepare('SELECT * FROM yarns WHERE weight_class = ? ORDER BY brand, color_name')
    .all(weightClass);
  return rows.map(rowToYarn);
}

export interface YarnGroup {
  brand: string;
  colorName: string | null;
  color: string | null;
  weightLabel: string | null;
  weightClass: number | null;
  fiber: string | null;
  totalYards: number;
  totalGrams: number;
  yarnIds: number[];
}

// Same-colorway stash rows pooled together — the sheet logs separate
// purchases/skeins of the same brand+colorway as separate rows, but a
// project draws on all of them as one pile of yarn. Shared by the
// per-project weight-class matching and the "what can I make with this"
// reverse lookup, so both see the same pools.
export function groupYarns(yarns: Yarn[]): YarnGroup[] {
  const groups = new Map<string, YarnGroup>();
  for (const yarn of yarns) {
    const key = `${yarn.brand}::${yarn.colorName ?? ''}`;
    const existing = groups.get(key);
    if (existing) {
      existing.totalYards += yarn.yards ?? 0;
      existing.totalGrams += yarn.grams ?? 0;
      existing.yarnIds.push(yarn.id);
    } else {
      groups.set(key, {
        brand: yarn.brand,
        colorName: yarn.colorName,
        color: yarn.color,
        weightLabel: yarn.weightLabel,
        weightClass: yarn.weightClass,
        fiber: yarn.fiber,
        totalYards: yarn.yards ?? 0,
        totalGrams: yarn.grams ?? 0,
        yarnIds: [yarn.id]
      });
    }
  }
  return Array.from(groups.values());
}

export function listYarnGroups(): YarnGroup[] {
  return groupYarns(listYarns());
}

// Full replace on every sync: the sheet is the source of truth for the
// inventory, and there's no stable natural key across edits (colors get
// renamed, rows get reordered) to make upserting safe.
export function replaceAllYarns(inputs: YarnInput[]): number {
  const insert = db.prepare(`
    INSERT INTO yarns (brand, color_name, color, weight_label, weight_class, fiber, yards_per_gram, grams, yards, source_url)
    VALUES (@brand, @colorName, @color, @weightLabel, @weightClass, @fiber, @yardsPerGram, @grams, @yards, @sourceUrl)
  `);

  const tx = db.transaction((rows: YarnInput[]) => {
    db.exec('DELETE FROM yarns');
    for (const row of rows) insert.run(row);
  });
  tx(inputs);
  return inputs.length;
}
