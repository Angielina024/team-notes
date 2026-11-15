import { describe, it, expect } from 'vitest';
import { archive, canEdit, canView, countTags } from '$lib/notes/domain';
import { makeNote, makeUser } from '../factories';

describe('canEdit', () => {
  it('lets the author edit the note', () => {
    const note = makeNote({ authorId: 'alice' });

    const result = canEdit(note, makeUser({ id: 'alice' }));

    expect(result).toBe(true);
  });

  it('refuses another user even for a published note', () => {
    const note = makeNote({ authorId: 'alice', status: 'published' });

    expect(canEdit(note, makeUser({ id: 'bob' }))).toBe(false);
  });
});

describe('canView', () => {
  it("shows another user's published note", () => {
    const note = makeNote({ authorId: 'alice', status: 'published' });

    expect(canView(note, makeUser({ id: 'bob' }))).toBe(true);
  });

  it("hides another user's draft", () => {
    const note = makeNote({ authorId: 'alice', status: 'draft' });

    expect(canView(note, makeUser({ id: 'bob' }))).toBe(false);
  });
});

describe('archive', () => {
  const now = new Date('2026-03-01T09:00:00Z');

  it('archives a note and stamps the time', () => {
    const note = makeNote({ status: 'published' });

    const result = archive(note, now);

    expect(result).toEqual({ ...note, status: 'archived', updatedAt: '2026-03-01T09:00:00.000Z' });
  });

  it('returns the same note when it is already archived', () => {
    const note = makeNote({ status: 'archived' });

    expect(archive(note, now)).toBe(note);
  });
});

describe('countTags', () => {
  it('counts tags and puts the most frequent first', () => {
    const notes = [makeNote({ tags: ['work', 'ideas'] }), makeNote({ tags: ['work'] })];

    expect(countTags(notes)).toEqual([
      { tag: 'work', count: 2 },
      { tag: 'ideas', count: 1 },
    ]);
  });
});