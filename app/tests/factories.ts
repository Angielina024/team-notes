import type { Note, User } from '$lib/notes/types';

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

export function makeUser(overrides: Partial<User> = {}): User {
  const id = overrides.id ?? nextId('user');
  return { id, email: `${id}@example.com`, name: `User ${id}`, ...overrides };
}

export function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: nextId('note'),
    authorId: 'user-0',
    title: 'Нотатка',
    body: '',
    status: 'draft',
    tags: [],
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}