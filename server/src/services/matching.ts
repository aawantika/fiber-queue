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
// the stated requirement — the "is this actually possible" check.
export function matchYarnsByWeightClass(
  weightClass: number,
  yardageMin: number | null,
  yardageMax: number | null
): YarnMatchGroup[] {
  const candidates = listYarnsByWeightClass(weightClass);
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
    group.meetsMin = yardageMin != null ? group.totalYards >= yardageMin : null;
    group.meetsMax = yardageMax != null ? group.totalYards >= yardageMax : null;
  }

  result.sort((a, b) => b.totalYards - a.totalYards);
  return result;
}

export function matchYarnsForProject(project: Project): YarnMatchGroup[] {
  if (project.weightClass == null) return [];
  return matchYarnsByWeightClass(project.weightClass, project.yardageMin, project.yardageMax);
}

export interface YarnComponent {
  weightLabel: string | null;
  weightClass: number | null;
  yarnName: string | null;
  yardageMin: number | null;
  yardageMax: number | null;
}

export function parseYarnComponents(raw: string | null): YarnComponent[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export interface ComponentMatch extends YarnComponent {
  matches: YarnMatchGroup[];
}

// For patterns worked with multiple strands held together: each component
// gets matched against stash on its own weight/yardage, independent of the
// pattern's single combined weight_class/yardage used by matchYarnsForProject.
export function matchYarnComponents(project: Project): ComponentMatch[] {
  const components = parseYarnComponents(project.yarnComponents);
  return components.map((component) => ({
    ...component,
    matches: component.weightClass != null ? matchYarnsByWeightClass(component.weightClass, component.yardageMin, component.yardageMax) : []
  }));
}
