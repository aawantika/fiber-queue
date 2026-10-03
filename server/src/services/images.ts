import fs from 'node:fs';
import path from 'node:path';
import { imagesDir } from '../db/client.js';

export async function downloadImageFor(url: string, slug: string | number): Promise<string | null> {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) return null;

  const ext = path.extname(new URL(url).pathname).split('?')[0] || '.jpg';
  const filename = `${slug}${ext}`;
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(path.join(imagesDir, filename), buffer);
  return `/images/${filename}`;
}
