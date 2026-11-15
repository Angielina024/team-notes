import postgres from 'postgres';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { NewNote } from '$lib/server/notes/repository';
import { PostgresNotesRepository } from '$lib/server/notes/postgres-repository';
import { runMigrations } from '../../scripts/migrate';

const url = process.env.DATABASE_URL_TEST;
if (!url) throw new Error('DATABASE_URL_TEST is not set');

const sql = postgres(url, { max: 2, onnotice: () => {} });
const repo = new PostgresNotesRepository(sql);
let authorId = '';

beforeAll(async () => {
  await runMigrations(sql, () => {}); // схема тестової бази = схема з міграцій
});

beforeEach(async () => {
  // кожен тест починає з порожньої бази і одного автора
  await sql`TRUNCATE users, sessions, notes, comments, tags, note_tags CASCADE`;
  const [user] = await sql<{ id: string }[]>`
    INSERT INTO users (email, name, password_hash) VALUES ('a@example.com', 'A', 'x') RETURNING id`;
  authorId = user!.id;
});

afterAll(async () => {
  await sql.end();
});

const newNote = (overrides: Partial<NewNote> = {}): NewNote => ({
  authorId,
  title: 'Нотатка',
  body: '',
  status: 'draft',
  tags: [],
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
  ...overrides,
});

describe('PostgresNotesRepository', () => {
  it('saves a note with tags and reads it back', async () => {
    const created = await repo.insert(newNote({ title: 'План', tags: ['work', 'ideas'] }));

    const found = await repo.findById(created.id);

    expect(found).toEqual({ ...created, tags: ['ideas', 'work'] });
  });

  it('filters the list by tag', async () => {
    await repo.insert(newNote({ title: 'Звіт', tags: ['work'] }));
    await repo.insert(newNote({ title: 'Рецепт', tags: ['home'] }));

    const page = await repo.list({ authorId, tag: 'work' }, { page: 1, limit: 20 });

    expect(page.items.map((n) => n.title)).toEqual(['Звіт']);
    expect(page.total).toBe(1);
  });

  it('updates the title and keeps the tags', async () => {
    const note = await repo.insert(newNote({ tags: ['work'] }));

    const updated = await repo.update(note.id, { title: 'Нова назва', updatedAt: '2026-02-01T00:00:00.000Z' });

    expect(updated?.title).toBe('Нова назва');
    expect(updated?.tags).toEqual(['work']);
  });

  it('removes tag links when the note is deleted', async () => {
    const note = await repo.insert(newNote({ tags: ['work'] }));

    await repo.delete(note.id);

    const [links] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM note_tags`;
    expect(links?.count).toBe(0);
  });

  it('returns null for an unknown id', async () => {
    expect(await repo.findById(crypto.randomUUID())).toBeNull();
  });
});