import { db, getSchemaSql } from './client.js';

// CREATE TABLE IF NOT EXISTS won't add new columns to a table that already
// exists, so schema changes after the first run need an explicit ALTER —
// this keeps existing rows (and the images already downloaded for them)
// intact instead of requiring a fresh db.
function ensureColumn(table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function migrate(): void {
  db.exec(getSchemaSql());
  ensureColumn('projects', 'gauge', 'TEXT');
  ensureColumn('projects', 'pattern_url', 'TEXT');
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  migrate();
  console.log('Migration complete.');
}
