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

// A column's CHECK constraint is baked into the table at CREATE TABLE time —
// ALTER TABLE can't modify it, so adding an allowed value (e.g. 'free' to
// pattern_status) needs the classic SQLite rebuild: rename the old table out
// of the way, let getSchemaSql() recreate it with the current constraint,
// copy the rows across, drop the old one. Runs only when the live table's
// CHECK doesn't already allow the new value, so it's a no-op afterward. Must
// run after the ensureColumn calls so both tables have identical columns for
// the INSERT.
function migratePatternStatusCheck(): void {
  const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'projects'`).get() as
    | { sql: string }
    | undefined;
  if (!row || row.sql.includes("'free'")) return;

  db.exec('ALTER TABLE projects RENAME TO projects_old');
  db.exec(getSchemaSql());
  // Column order differs between the two (ALTER TABLE ADD COLUMN always
  // appends at the end, so the old table has gauge/pattern_url/needs_review/
  // yarn_components trailing; the fresh schema.sql places them inline) — a
  // bare `SELECT *` silently inserts by position and corrupts columns, so
  // the shared column names have to be listed explicitly on both sides.
  const columns = (db.prepare(`PRAGMA table_info(projects_old)`).all() as { name: string }[]).map((c) => c.name);
  const columnList = columns.join(', ');
  db.exec(`INSERT INTO projects (${columnList}) SELECT ${columnList} FROM projects_old`);
  db.exec('DROP TABLE projects_old');
}

export function migrate(): void {
  db.exec(getSchemaSql());
  ensureColumn('projects', 'gauge', 'TEXT');
  ensureColumn('projects', 'pattern_url', 'TEXT');
  ensureColumn('projects', 'needs_review', "INTEGER NOT NULL DEFAULT 0");
  ensureColumn('projects', 'yarn_components', 'TEXT');
  migratePatternStatusCheck();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  migrate();
  console.log('Migration complete.');
}
