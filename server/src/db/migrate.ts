import { db, getSchemaSql } from './client.js';

export function migrate(): void {
  db.exec(getSchemaSql());
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  migrate();
  console.log('Migration complete.');
}
