import type { Note } from '$lib/notes/types';
import type { ListQuery, NoteCreate, NotePatch } from '$lib/notes/schema';

export const DEMO_AUTHOR_ID = 'demo-user';

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

const notes = new Map<string, Note>();

export function listNotes({ authorId, tag, page, limit }: ListQuery & { authorId?: string }): Page<Note> {
  const matching = [...notes.values()]
    .filter((note) => !authorId || note.authorId === authorId)
    .filter((note) => !tag || note.tags.includes(tag))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const start = (page - 1) * limit;
  return { items: matching.slice(start, start + limit), page, limit, total: matching.length };
}

export function getNote(id: string): Note | undefined {
  return notes.get(id);
}

export function createNote(input: NoteCreate, authorId: string): Note {
  const now = new Date().toISOString();
  const note: Note = { id: crypto.randomUUID(), authorId, ...input, createdAt: now, updatedAt: now };
  notes.set(note.id, note);
  return note;
}

export function updateNote(id: string, patch: NotePatch): Note | undefined {
  const current = notes.get(id);
  if (!current) return undefined;
  const updated: Note = { ...current, ...patch, updatedAt: new Date().toISOString() };
  notes.set(id, updated);
  return updated;
}

export function deleteNote(id: string): boolean {
  return notes.delete(id);
}

for (let i = 1; i <= 25; i++) {
  createNote(
    {
      title: `Seed note ${i}`,
      body: 'Created on server start',
      status: 'published',
      tags: i % 3 === 0 ? ['work'] : ['home']
    },
    DEMO_AUTHOR_ID
  );
}