import { Router } from 'express';
import { z } from 'zod';
import {
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  updateProject,
  type ProjectInput
} from '../db/projects.js';
import { downloadImageFor } from '../services/images.js';
import { matchYarnsForProject } from '../services/matching.js';
import { fetchProjectFromRavelryUrl } from '../services/ravelry.js';

export const projectsRouter = Router();

const manualProjectSchema = z.object({
  name: z.string().min(1),
  category: z.string().nullable().optional(),
  craft: z.string().nullable().optional(),
  designer: z.string().nullable().optional(),
  status: z.enum(['queue', 'in_progress', 'completed', 'frogged']).default('queue'),
  patternStatus: z.enum(['have', 'need_to_buy']).default('need_to_buy'),
  patternFree: z.boolean().default(false),
  yardageMin: z.number().nullable().optional(),
  yardageMax: z.number().nullable().optional(),
  yardageBySize: z.string().nullable().optional(),
  sizesAvailable: z.string().nullable().optional(),
  weightLabel: z.string().nullable().optional(),
  weightClass: z.number().int().min(0).max(6).nullable().optional(),
  needleSizes: z.string().nullable().optional(),
  hookSizes: z.string().nullable().optional(),
  gauge: z.string().nullable().optional(),
  suggestedYarn: z.string().nullable().optional(),
  published: z.string().nullable().optional(),
  patternUrl: z.string().url().nullable().optional(),
  imageSourceUrl: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional()
});

function fillDefaults(partial: Partial<ProjectInput>): ProjectInput {
  return {
    name: partial.name ?? '',
    category: partial.category ?? null,
    craft: partial.craft ?? null,
    designer: partial.designer ?? null,
    status: partial.status ?? 'queue',
    patternStatus: partial.patternStatus ?? 'need_to_buy',
    patternFree: partial.patternFree ?? false,
    ravelryId: partial.ravelryId ?? null,
    ravelryPermalink: partial.ravelryPermalink ?? null,
    ravelryUrl: partial.ravelryUrl ?? null,
    patternUrl: partial.patternUrl ?? null,
    yardageMin: partial.yardageMin ?? null,
    yardageMax: partial.yardageMax ?? null,
    yardageBySize: partial.yardageBySize ?? null,
    sizesAvailable: partial.sizesAvailable ?? null,
    weightLabel: partial.weightLabel ?? null,
    weightClass: partial.weightClass ?? null,
    needleSizes: partial.needleSizes ?? null,
    hookSizes: partial.hookSizes ?? null,
    gauge: partial.gauge ?? null,
    suggestedYarn: partial.suggestedYarn ?? null,
    published: partial.published ?? null,
    imagePath: partial.imagePath ?? null,
    imageSourceUrl: partial.imageSourceUrl ?? null,
    notes: partial.notes ?? null
  };
}

projectsRouter.get('/', (_req, res) => {
  const projects = listProjects().map((project) => {
    const matches = matchYarnsForProject(project);
    const bestMatchYards = matches.reduce((max, m) => Math.max(max, m.totalYards), 0);
    const hasYardageMatch = matches.some((m) => m.meetsMin !== false && m.meetsMax !== false);
    return { ...project, bestMatchYards, hasYardageMatch: matches.length > 0 ? hasYardageMatch : null };
  });
  res.json(projects);
});

projectsRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const project = getProjectById(id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({ ...project, yarnMatches: matchYarnsForProject(project) });
});

// Two ways in: { ravelryUrl } auto-fetches specs+photo from Ravelry; anything
// else is a manual add (for patterns that aren't on Ravelry at all).
projectsRouter.post('/', async (req, res) => {
  const ravelryUrlSchema = z.object({ ravelryUrl: z.string().url() });
  const asRavelry = ravelryUrlSchema.safeParse(req.body);

  if (asRavelry.success) {
    try {
      const input = await fetchProjectFromRavelryUrl(asRavelry.data.ravelryUrl);
      return res.status(201).json(createProject(input));
    } catch (err) {
      return res.status(502).json({ error: err instanceof Error ? err.message : 'Ravelry fetch failed' });
    }
  }

  const parsed = manualProjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { imageSourceUrl, ...rest } = parsed.data;
  let project = createProject(fillDefaults({ ...rest, imageSourceUrl: imageSourceUrl ?? null }));

  if (imageSourceUrl) {
    const imagePath = await downloadImageFor(imageSourceUrl, `manual-${project.id}`);
    if (imagePath) project = updateProject(project.id, fillDefaults({ ...project, imagePath }))!;
  }

  res.status(201).json(project);
});

projectsRouter.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const existing = getProjectById(id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const parsed = manualProjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { imageSourceUrl, ...rest } = parsed.data;
  let input = fillDefaults({
    ...existing,
    ...rest,
    imageSourceUrl: imageSourceUrl ?? existing.imageSourceUrl,
    imagePath: existing.imagePath,
    ravelryId: existing.ravelryId,
    ravelryPermalink: existing.ravelryPermalink,
    ravelryUrl: existing.ravelryUrl
  });

  if (imageSourceUrl && imageSourceUrl !== existing.imageSourceUrl) {
    const imagePath = await downloadImageFor(imageSourceUrl, `manual-${id}`);
    if (imagePath) input = { ...input, imagePath };
  }

  res.json(updateProject(id, input));
});

// Re-pulls spec fields (yardage, weight, needle/hook sizes, gauge, photo...)
// from Ravelry without disturbing what's yours: status, pattern_status,
// notes, and yardage_by_size survive the refresh untouched.
projectsRouter.post('/:id/refresh', async (req, res) => {
  const id = Number(req.params.id);
  const existing = getProjectById(id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });
  if (!existing.ravelryUrl) return res.status(400).json({ error: 'Project has no Ravelry link to refresh from' });

  try {
    const fresh = await fetchProjectFromRavelryUrl(existing.ravelryUrl);
    const input = fillDefaults({
      ...fresh,
      status: existing.status,
      patternStatus: existing.patternStatus,
      notes: existing.notes,
      yardageBySize: existing.yardageBySize
    });
    res.json(updateProject(id, input));
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Ravelry refresh failed' });
  }
});

projectsRouter.delete('/:id', (req, res) => {
  deleteProject(Number(req.params.id));
  res.status(204).send();
});
