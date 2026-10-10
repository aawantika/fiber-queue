import { db } from './client.js';

export interface YarnNote {
  id: number;
  brand: string;
  colorName: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

function rowToNote(row: any): YarnNote {
  return {
    id: row.id,
    brand: row.brand,
    colorName: row.color_name,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listYarnNotes(): YarnNote[] {
  return (db.prepare('SELECT * FROM yarn_notes ORDER BY brand, color_name').all() as any[]).map(rowToNote);
}

// One note per (brand, colorName) — colorName NULL means "applies to every
// colorway of this brand" (the common case: a fiber-content property like
// "runs warm" is true of the whole product line, not one dye lot). Upsert by
// delete-then-insert rather than relying on a UNIQUE constraint, since
// SQLite treats NULL colorName values as all-distinct under UNIQUE.
export function upsertYarnNote(brand: string, colorName: string | null, note: string): YarnNote {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM yarn_notes WHERE brand = ? AND color_name IS ?').run(brand, colorName);
    const result = db
      .prepare('INSERT INTO yarn_notes (brand, color_name, note) VALUES (?, ?, ?)')
      .run(brand, colorName, note);
    return result.lastInsertRowid as number;
  });
  const id = tx();
  return rowToNote(db.prepare('SELECT * FROM yarn_notes WHERE id = ?').get(id));
}

export function deleteYarnNote(id: number): void {
  db.prepare('DELETE FROM yarn_notes WHERE id = ?').run(id);
}

// Colorway-specific note wins over a brand-wide one.
export function findNoteFor(notes: YarnNote[], brand: string, colorName: string | null): YarnNote | null {
  return (
    notes.find((n) => n.brand === brand && n.colorName === colorName) ??
    notes.find((n) => n.brand === brand && n.colorName === null) ??
    null
  );
}
