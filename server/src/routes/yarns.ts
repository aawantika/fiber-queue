import { Router } from 'express';
import { z } from 'zod';
import { listYarnGroups, listYarns } from '../db/yarns.js';
import { deleteYarnNote, findNoteFor, listYarnNotes, upsertYarnNote } from '../db/yarnNotes.js';
import { matchSelectionToProjects } from '../services/matching.js';
import { syncYarnSheet } from '../services/yarnSheet.js';

export const yarnsRouter = Router();

yarnsRouter.get('/', (_req, res) => {
  res.json(listYarns());
});

yarnsRouter.get('/groups', (_req, res) => {
  const notes = listYarnNotes();
  const groups = listYarnGroups().map((g) => ({
    ...g,
    note: findNoteFor(notes, g.brand, g.colorName)
  }));
  res.json(groups);
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

yarnsRouter.get('/notes', (_req, res) => {
  res.json(listYarnNotes());
});

const noteSchema = z.object({
  brand: z.string().min(1),
  colorName: z.string().nullable(),
  note: z.string().min(1)
});

yarnsRouter.put('/notes', (req, res) => {
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.json(upsertYarnNote(parsed.data.brand, parsed.data.colorName, parsed.data.note));
});

yarnsRouter.delete('/notes/:id', (req, res) => {
  deleteYarnNote(Number(req.params.id));
  res.status(204).send();
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
