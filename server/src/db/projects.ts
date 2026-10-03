import { db } from './client.js';

export interface ProjectInput {
  name: string;
  category: string | null;
  craft: string | null;
  designer: string | null;
  status: 'queue' | 'in_progress' | 'completed' | 'frogged';
  patternStatus: 'have' | 'need_to_buy';
  patternFree: boolean;
  ravelryId: number | null;
  ravelryPermalink: string | null;
  ravelryUrl: string | null;
  yardageMin: number | null;
  yardageMax: number | null;
  yardageBySize: string | null;
  sizesAvailable: string | null;
  weightLabel: string | null;
  weightClass: number | null;
  needleSizes: string | null;
  hookSizes: string | null;
  suggestedYarn: string | null;
  published: string | null;
  imagePath: string | null;
  imageSourceUrl: string | null;
  notes: string | null;
}

export interface Project extends ProjectInput {
  id: number;
  createdAt: string;
  updatedAt: string;
}

function rowToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    craft: row.craft,
    designer: row.designer,
    status: row.status,
    patternStatus: row.pattern_status,
    patternFree: Boolean(row.pattern_free),
    ravelryId: row.ravelry_id,
    ravelryPermalink: row.ravelry_permalink,
    ravelryUrl: row.ravelry_url,
    yardageMin: row.yardage_min,
    yardageMax: row.yardage_max,
    yardageBySize: row.yardage_by_size,
    sizesAvailable: row.sizes_available,
    weightLabel: row.weight_label,
    weightClass: row.weight_class,
    needleSizes: row.needle_sizes,
    hookSizes: row.hook_sizes,
    suggestedYarn: row.suggested_yarn,
    published: row.published,
    imagePath: row.image_path,
    imageSourceUrl: row.image_source_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listProjects(): Project[] {
  const rows = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  return rows.map(rowToProject);
}

export function getProjectById(id: number): Project | null {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  return row ? rowToProject(row) : null;
}

const INSERT_COLUMNS = `
  name, category, craft, designer, status, pattern_status, pattern_free, ravelry_id, ravelry_permalink, ravelry_url,
  yardage_min, yardage_max, yardage_by_size, sizes_available, weight_label, weight_class,
  needle_sizes, hook_sizes, suggested_yarn, published, image_path, image_source_url, notes
`;

const INSERT_PARAMS = `
  @name, @category, @craft, @designer, @status, @patternStatus, @patternFree, @ravelryId, @ravelryPermalink, @ravelryUrl,
  @yardageMin, @yardageMax, @yardageBySize, @sizesAvailable, @weightLabel, @weightClass,
  @needleSizes, @hookSizes, @suggestedYarn, @published, @imagePath, @imageSourceUrl, @notes
`;

function toRow(input: ProjectInput) {
  return { ...input, patternFree: input.patternFree ? 1 : 0 };
}

export function createProject(input: ProjectInput): Project {
  const result = db.prepare(`INSERT INTO projects (${INSERT_COLUMNS}) VALUES (${INSERT_PARAMS})`).run(toRow(input));
  return getProjectById(Number(result.lastInsertRowid))!;
}

export function updateProject(id: number, input: ProjectInput): Project | null {
  db.prepare(
    `UPDATE projects SET
      name = @name, category = @category, craft = @craft, designer = @designer, status = @status,
      pattern_status = @patternStatus, pattern_free = @patternFree,
      ravelry_id = @ravelryId, ravelry_permalink = @ravelryPermalink, ravelry_url = @ravelryUrl,
      yardage_min = @yardageMin, yardage_max = @yardageMax, yardage_by_size = @yardageBySize,
      sizes_available = @sizesAvailable, weight_label = @weightLabel, weight_class = @weightClass,
      needle_sizes = @needleSizes, hook_sizes = @hookSizes, suggested_yarn = @suggestedYarn,
      published = @published, image_path = @imagePath, image_source_url = @imageSourceUrl, notes = @notes,
      updated_at = datetime('now')
     WHERE id = @id`
  ).run({ ...toRow(input), id });
  return getProjectById(id);
}

export function deleteProject(id: number): void {
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}
