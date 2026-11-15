import postgres, { type Sql } from 'postgres';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = fileURLToPath(new URL('../db/migrations', import.meta.url));

export async function runMigrations(sql: Sql, log: (message: string) => void = console.log): Promise<void> {
  // 1. таблиця-журнал: які міграції вже виконано
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`;

  // 2. усі .sql файли за порядком імен: 001_…, 002_…
  const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    // 3. уже виконано? пропускаємо
    const [done] = await sql`SELECT 1 FROM schema_migrations WHERE name = ${file}`;
    if (done) continue;

    // 4. виконати файл і записати в журнал — в одній транзакції
    const text = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    await sql.begin(async (tx) => {
      await tx.unsafe(text);
      await tx`INSERT INTO schema_migrations (name) VALUES (${file})`;
    });
    log(`applied ${file}`);
  }
}

const isMain = path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);

if (isMain) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  console.log(`target: ${new URL(url).pathname}`); // яку базу міняємо
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await runMigrations(sql);
    console.log('done');
  } finally {
    await sql.end();
  }
}