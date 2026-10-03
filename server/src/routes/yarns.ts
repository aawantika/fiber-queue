import { Router } from 'express';
import { listYarns } from '../db/yarns.js';
import { syncYarnSheet } from '../services/yarnSheet.js';

export const yarnsRouter = Router();

yarnsRouter.get('/', (_req, res) => {
  res.json(listYarns());
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
