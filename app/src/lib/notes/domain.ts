import type { Note, User } from './types';

export const TITLE_MAX_LENGTH = 120;
export const BODY_MAX_LENGTH = 10_000;
export const TAG_MAX_LENGTH = 30;
export const MAX_TAGS_PER_NOTE = 10;

type Actor = Pick<User, 'id'>;

export function canEdit(note: Note, user: Actor): boolean {
  return note.authorId === user.id;
}

export function canView(note: Note, user: Actor): boolean {
  return canEdit(note, user) || note.status === 'published';
}

/** Архівує нотатку. Якщо вона вже в архіві — повертає її без змін. */
export function archive(note: Note, now: Date): Note {
  if (note.status === 'archived') return note;
  return { ...note, status: 'archived', updatedAt: now.toISOString() };
}

export interface TagCount {
  tag: string;
  count: number;
}

/** Скільки разів зустрічається кожен тег; найчастіші — першими. */
export function countTags(notes: readonly Note[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}