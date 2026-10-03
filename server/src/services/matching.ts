import { listYarnsByWeightClass } from '../db/yarns.js';
import type { Project } from '../db/projects.js';

export interface YarnMatchGroup {
  brand: string;
  colorName: string | null;
  color: string | null;
  weightLabel: string | null;
  fiber: string | null;
  totalYards: number;
  totalGrams: number;
  yarnIds: number[];
  meetsMin: boolean | null;
  meetsMax: boolean | null;
}

// Groups same-weight-class stash entries by brand+colorway (a project usually
// draws on every skein of one colorway, not just one row from the sheet),
// sums their yardage, and flags whether that pooled yardage actually clears
// the pattern's stated requirement — the "is this actually possible" check.
export function matchYarnsForProject(project: Project): YarnMatchGroup[] {
  if (project.weightClass == null) return [];

  const candidates = listYarnsByWeightClass(project.weightClass);
  const groups = new Map<string, YarnMatchGroup>();

  for (const yarn of candidates) {
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
        fiber: yarn.fiber,
        totalYards: yarn.yards ?? 0,
        totalGrams: yarn.grams ?? 0,
        yarnIds: [yarn.id],
        meetsMin: null,
        meetsMax: null
      });
    }
  }

  const result = Array.from(groups.values());
  for (const group of result) {
    group.meetsMin = project.yardageMin != null ? group.totalYards >= project.yardageMin : null;
    group.meetsMax = project.yardageMax != null ? group.totalYards >= project.yardageMax : null;
  }

  result.sort((a, b) => b.totalYards - a.totalYards);
  return result;
}
