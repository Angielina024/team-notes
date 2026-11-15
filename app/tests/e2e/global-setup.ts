import postgres from 'postgres';
import { runMigrations } from '../../scripts/migrate';

export default async function globalSetup() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error('DATABASE_URL_TEST is not set');
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await runMigrations(sql, () => {});
    await sql`TRUNCATE users, sessions, notes, comments, tags, note_tags CASCADE`;
  } finally {
    await sql.end();
  }
}