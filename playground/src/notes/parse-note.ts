import type { Note, NoteStatus, Result } from './types';

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

const NOTE_STATUSES = {
  draft: true,
  published: true,
  archived: true,
} satisfies Record<NoteStatus, true>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNoteStatus(value: unknown): value is NoteStatus {
  return typeof value === 'string' && Object.hasOwn(NOTE_STATUSES, value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export function parseNote(input: unknown): Result<Note> {
  if (!isRecord(input)) return err('note: очікується об’єкт');

  const { id, authorId, title, body, status, tags, createdAt, updatedAt } = input;

  if (!isNonEmptyString(id)) return err('id: очікується непорожній рядок');
  if (!isNonEmptyString(authorId)) return err('authorId: очікується непорожній рядок');
  if (!isNonEmptyString(title)) return err('title: очікується непорожній рядок');
  if (typeof body !== 'string') return err('body: очікується рядок');
  if (!isNoteStatus(status)) return err(`status: очікується одне з ${Object.keys(NOTE_STATUSES).join(', ')}`);
  if (!isStringArray(tags)) return err('tags: очікується масив рядків');
  if (!isIsoDate(createdAt)) return err('createdAt: очікується дата ISO 8601');
  if (!isIsoDate(updatedAt)) return err('updatedAt: очікується дата ISO 8601');

  return ok({ id, authorId, title, body, status, tags: [...tags], createdAt, updatedAt });
}
