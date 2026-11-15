import type { Note } from '$lib/notes/types';

export interface NoteFilter {
  authorId: string;
  tag?: string;
}

export interface PageRequest {
  page: number;
  limit: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

/** Нотатка перед збереженням: id ще немає, його видасть сховище. */
export type NewNote = Omit<Note, 'id'>;

/** Що можна змінити. updatedAt обов'язковий: забути його не дасть TypeScript. */
export type NoteChanges = Partial<Pick<Note, 'title' | 'body' | 'status' | 'tags'>> & Pick<Note, 'updatedAt'>;

export interface NotesRepository {
  list(filter: NoteFilter, page: PageRequest): Promise<Page<Note>>;
  findById(id: string): Promise<Note | null>;
  insert(data: NewNote): Promise<Note>;
  update(id: string, changes: NoteChanges): Promise<Note | null>;
  delete(id: string): Promise<boolean>;
}