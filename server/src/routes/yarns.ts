import { Router } from 'express';
import { z } from 'zod';
import { listYarnGroups, listYarns } from '../db/yarns.js';
import { matchSelectionToProjects } from '../services/matching.js';
import { syncYarnSheet } from '../services/yarnSheet.js';

export const yarnsRouter = Router();

yarnsRouter.get('/', (_req, res) => {
  res.json(listYarns());
});

yarnsRouter.get('/groups', (_req, res) => {
  res.json(listYarnGroups());
});

const matchSchema = z.object({
  groups: z.array(
    z.object({
      brand: z.string(),
      colorName: z.string().nullable(),
      weightClass: z.number().nullable(),
      totalYards: z.number()
    })
  )
});

yarnsRouter.post('/match', (req, res) => {
  const parsed = matchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.json(matchSelectionToProjects(parsed.data.groups));
});

yarnsRouter.get('/sheet-url', (_req, res) => {
  const sheetId = process.env.YARN_SHEET_ID;
  res.json({ url: sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null });
});

yarnsRouter.post('/sync', async (_req, res) => {
  try {
    const count = await syncYarnSheet();
    res.json({ imported: count });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Sync failed' });
  }
});
