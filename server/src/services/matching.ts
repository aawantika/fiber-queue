import { groupYarns, listYarnsByWeightClass } from '../db/yarns.js';
import { listProjects, type Project } from '../db/projects.js';

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
  const result: YarnMatchGroup[] = groupYarns(listYarnsByWeightClass(weightClass)).map((g) => ({
    ...g,
    meetsMin: yardageMin != null ? g.totalYards >= yardageMin : null,
    meetsMax: yardageMax != null ? g.totalYards >= yardageMax : null
  }));
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

// --- Reverse lookup: given stash you've selected, what can you make? ---

export interface SelectedGroupInput {
  brand: string;
  colorName: string | null;
  weightClass: number | null;
  totalYards: number;
}

export interface SoloProjectMatch {
  project: Project;
  availableYards: number;
  meetsMin: boolean | null;
  meetsMax: boolean | null;
}

export interface HeldTogetherComponentResult extends YarnComponent {
  availableYards: number;
  meetsMin: boolean | null;
}

export interface HeldTogetherProjectMatch {
  project: Project;
  components: HeldTogetherComponentResult[];
}

export interface SelectionMatchResult {
  yardsByWeightClass: Record<number, number>;
  soloMatches: SoloProjectMatch[];
  heldTogetherMatches: HeldTogetherProjectMatch[];
}

// Selecting one weight class of stash shows every project at that weight,
// flagged by whether the selected total actually clears it (same "is this
// possible" check as the per-project view, just entered from the yarn side).
// Selecting exactly two different weight classes additionally checks every
// held-together (multi-strand) project to see if its two strand weights are
// the same two classes you picked — that's the literal "what does mixing
// these two yarns unlock" question.
export function matchSelectionToProjects(selected: SelectedGroupInput[]): SelectionMatchResult {
  const yardsByWeightClass = new Map<number, number>();
  for (const g of selected) {
    if (g.weightClass == null) continue;
    yardsByWeightClass.set(g.weightClass, (yardsByWeightClass.get(g.weightClass) ?? 0) + g.totalYards);
  }
  const classes = Array.from(yardsByWeightClass.keys());
  const allProjects = listProjects();

  const soloMatches: SoloProjectMatch[] = [];
  for (const weightClass of classes) {
    const available = yardsByWeightClass.get(weightClass)!;
    for (const project of allProjects) {
      if (project.weightClass !== weightClass) continue;
      soloMatches.push({
        project,
        availableYards: available,
        meetsMin: project.yardageMin != null ? available >= project.yardageMin : null,
        meetsMax: project.yardageMax != null ? available >= project.yardageMax : null
      });
    }
  }
  soloMatches.sort((a, b) => {
    if (a.meetsMin !== b.meetsMin) return a.meetsMin ? -1 : 1;
    return a.project.name.localeCompare(b.project.name);
  });

  const heldTogetherMatches: HeldTogetherProjectMatch[] = [];
  if (classes.length === 2) {
    const [classA, classB] = classes;
    for (const project of allProjects) {
      const components = parseYarnComponents(project.yarnComponents);
      if (components.length !== 2) continue;
      const [first, second] = components;
      const isMatch =
        (first.weightClass === classA && second.weightClass === classB) ||
        (first.weightClass === classB && second.weightClass === classA);
      if (!isMatch) continue;

      heldTogetherMatches.push({
        project,
        components: components.map((c) => {
          const available = c.weightClass != null ? yardsByWeightClass.get(c.weightClass) ?? 0 : 0;
          return { ...c, availableYards: available, meetsMin: c.yardageMin != null ? available >= c.yardageMin : null };
        })
      });
    }
  }

  return { yardsByWeightClass: Object.fromEntries(yardsByWeightClass), soloMatches, heldTogetherMatches };
}
