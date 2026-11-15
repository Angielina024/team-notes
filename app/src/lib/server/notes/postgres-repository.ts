import type { Sql } from 'postgres';
import type { Note, NoteStatus } from '$lib/notes/types';
import type { Db } from '$lib/server/db';
import type { NewNote, NoteChanges, NoteFilter, NotesRepository, Page, PageRequest } from './repository';

interface NoteRow {
  id: string;
  author_id: string;
  title: string;
  body: string;
  status: NoteStatus;
  created_at: Date;
  updated_at: Date;
}

type TagMap = Map<string, string[]>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toNote(row: NoteRow, tags: string[]): Note {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    body: row.body,
    status: row.status,
    tags,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/** Теги багатьох нотаток одним запитом — ліки від N+1. */
async function loadTags(db: Db, noteIds: string[]): Promise<TagMap> {
  const byNote: TagMap = new Map();
  if (noteIds.length === 0) return byNote;

  const rows = await db<{ note_id: string; name: string }[]>`
    SELECT nt.note_id, t.name
    FROM note_tags AS nt
    JOIN tags AS t ON t.id = nt.tag_id
    WHERE nt.note_id = ANY(${noteIds}::uuid[])
    ORDER BY t.name`;

  for (const { note_id, name } of rows) {
    const tags = byNote.get(note_id) ?? [];
    tags.push(name);
    byNote.set(note_id, tags);
  }
  return byNote;
}

async function saveTags(db: Db, noteId: string, tags: string[]): Promise<string[]> {
  const names = [...new Set(tags)].sort();
  await db`DELETE FROM note_tags WHERE note_id = ${noteId}`;
  if (names.length === 0) return [];

  // створити теги, яких ще немає (ідемпотентно)
  await db`INSERT INTO tags (name) SELECT unnest(${names}::text[]) ON CONFLICT (name) DO NOTHING`;
  // зв'язати нотатку з тегами
  await db`
    INSERT INTO note_tags (note_id, tag_id)
    SELECT ${noteId}::uuid, id FROM tags WHERE name = ANY(${names}::text[])`;
  return names;
}

export class PostgresNotesRepository implements NotesRepository {
  private readonly sql: Sql;

  constructor(sql: Sql) {
    this.sql = sql;
  }

  async list({ authorId, tag }: NoteFilter, { page, limit }: PageRequest): Promise<Page<Note>> {
    const sql = this.sql;
    // частина умови для фільтра за тегом; без тегу — порожній фрагмент
    const tagFilter = () =>
      tag
        ? sql`AND EXISTS (
            SELECT 1 FROM note_tags AS nt JOIN tags AS t ON t.id = nt.tag_id
            WHERE nt.note_id = n.id AND t.name = ${tag})`
        : sql``;

    const [rows, [count]] = await Promise.all([
      sql<NoteRow[]>`
        SELECT n.* FROM notes AS n
        WHERE n.author_id = ${authorId} ${tagFilter()}
        ORDER BY n.updated_at DESC, n.id
        LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      sql<{ total: number }[]>`
        SELECT count(*)::int AS total FROM notes AS n
        WHERE n.author_id = ${authorId} ${tagFilter()}`,
    ]);

    const tags = await loadTags(sql, rows.map((row) => row.id));
    return {
      items: rows.map((row) => toNote(row, tags.get(row.id) ?? [])),
      page,
      limit,
      total: count?.total ?? 0,
    };
  }

  async findById(id: string): Promise<Note | null> {
    if (!UUID_PATTERN.test(id)) return null;
    const [row] = await this.sql<NoteRow[]>`SELECT * FROM notes WHERE id = ${id}`;
    if (!row) return null;
    const tags = await loadTags(this.sql, [row.id]);
    return toNote(row, tags.get(row.id) ?? []);
  }

  async insert(data: NewNote): Promise<Note> {
    return this.sql.begin(async (tx) => {
      const [row] = await tx<NoteRow[]>`
        INSERT INTO notes (author_id, title, body, status, created_at, updated_at)
        VALUES (${data.authorId}, ${data.title}, ${data.body}, ${data.status},
                ${data.createdAt}, ${data.updatedAt})
        RETURNING *`;
      if (!row) throw new Error('INSERT returned no row');
      const tags = await saveTags(tx, row.id, data.tags);
      return toNote(row, tags);
    });
  }

  async update(id: string, changes: NoteChanges): Promise<Note | null> {
    if (!UUID_PATTERN.test(id)) return null;
    return this.sql.begin(async (tx) => {
      const [row] = await tx<NoteRow[]>`
        UPDATE notes SET
          title      = coalesce(${changes.title ?? null}, title),
          body       = coalesce(${changes.body ?? null}, body),
          status     = coalesce(${changes.status ?? null}, status),
          updated_at = ${changes.updatedAt}
        WHERE id = ${id}
        RETURNING *`;
      if (!row) return null;
      const tags = changes.tags
        ? await saveTags(tx, id, changes.tags)
        : ((await loadTags(tx, [id])).get(id) ?? []);
      return toNote(row, tags);
    });
  }

  async delete(id: string): Promise<boolean> {
    if (!UUID_PATTERN.test(id)) return false;
    const result = await this.sql`DELETE FROM notes WHERE id = ${id}`;
    return result.count > 0;
  }
}