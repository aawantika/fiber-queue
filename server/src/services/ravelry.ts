import type { ProjectInput } from '../db/projects.js';
import { downloadImageFor } from './images.js';
import { classFromRavelryName } from './weightClass.js';

const API_KEY = process.env.RAVELRY_API_KEY;
const API_SECRET = process.env.RAVELRY_API_SECRET;

function authHeader(): string {
  if (!API_KEY || !API_SECRET) throw new Error('RAVELRY_API_KEY / RAVELRY_API_SECRET are not configured');
  return 'Basic ' + Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
}

// Ravelry pattern pages are public and embed the numeric pattern id directly
// in the HTML (data-pattern-id="..."), so a plain pattern URL is enough —
// no API call needed just to resolve a permalink to an id.
export async function resolvePatternId(ravelryUrl: string): Promise<number> {
  const response = await fetch(ravelryUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) throw new Error(`Failed to load Ravelry page: ${response.status}`);

  const html = await response.text();
  const match = html.match(/data-pattern-id="(\d+)"/);
  if (!match) throw new Error('Could not find a pattern id on that Ravelry page — is it a pattern URL?');
  return Number(match[1]);
}

interface RavelryPattern {
  [key: string]: any;
}

async function fetchPattern(id: number): Promise<RavelryPattern> {
  const response = await fetch(`https://api.ravelry.com/patterns/${id}.json`, {
    headers: { Authorization: authHeader() }
  });
  if (!response.ok) throw new Error(`Ravelry API error: ${response.status}`);
  const body = (await response.json()) as { pattern: RavelryPattern };
  return body.pattern;
}

function categoryPath(category: any): string {
  const parts: string[] = [];
  let node = category;
  while (node) {
    parts.unshift(node.name);
    node = node.parent;
  }
  return parts.join(' > ');
}

export async function fetchProjectFromRavelryUrl(ravelryUrl: string): Promise<ProjectInput> {
  const id = await resolvePatternId(ravelryUrl);
  const pattern = await fetchPattern(id);

  const photoUrl = pattern.photos?.[0]?.medium_url ?? null;
  const imagePath = photoUrl ? await downloadImageFor(photoUrl, `ravelry-${id}`) : null;

  const needles = (pattern.pattern_needle_sizes ?? []).filter((s: any) => s.knitting);
  const hooks = (pattern.pattern_needle_sizes ?? []).filter((s: any) => s.crochet);

  const categories: string[] = (pattern.pattern_categories ?? []).map(categoryPath);
  const suggestedYarn: string[] = (pattern.packs ?? [])
    .map((p: any) => p.yarn?.name && p.yarn?.yarn_company_name ? `${p.yarn.yarn_company_name} ${p.yarn.name}` : null)
    .filter(Boolean);

  // More than one pack with its own yarn_weight means the pattern is worked
  // with strands of different weights held together (e.g. a lace + a
  // worsted held double to approximate Aran) — each needs to be matched
  // against stash on its own weight, not just the pattern's single combined
  // yarn_weight/yardage fields. Per-strand yardage isn't reliably in
  // structured fields (only the combined range above is), so it's left for
  // manual entry rather than guessed from free-text materials.
  const packs = pattern.packs ?? [];
  const yarnComponents =
    packs.length > 1
      ? JSON.stringify(
          packs.map((p: any) => ({
            weightLabel: p.yarn_weight?.name ?? null,
            weightClass: classFromRavelryName(p.yarn_weight?.name),
            yarnName: p.yarn?.name ?? null,
            yardageMin: null,
            yardageMax: null
          }))
        )
      : null;

  return {
    name: pattern.name,
    category: categories.join('; ') || null,
    craft: pattern.craft?.name ?? null,
    designer: pattern.pattern_author?.name ?? pattern.designer?.name ?? null,
    status: 'queue',
    patternStatus: 'need_to_buy',
    patternFree: Boolean(pattern.free),
    needsReview: false,
    ravelryId: pattern.id,
    ravelryPermalink: pattern.permalink,
    ravelryUrl: ravelryUrl,
    patternUrl: ravelryUrl,
    yardageMin: pattern.yardage ?? null,
    yardageMax: pattern.yardage_max ?? null,
    yardageBySize: null,
    sizesAvailable: pattern.sizes_available ?? null,
    weightLabel: pattern.yarn_weight?.name ?? null,
    weightClass: classFromRavelryName(pattern.yarn_weight?.name),
    needleSizes: needles.map((n: any) => n.name).join(', ') || null,
    hookSizes: hooks.map((h: any) => h.name).join(', ') || null,
    gauge: pattern.gauge_description ?? null,
    yarnComponents,
    suggestedYarn: suggestedYarn.join(', ') || null,
    published: pattern.published ?? null,
    imagePath,
    imageSourceUrl: photoUrl,
    notes: null
  };
}
