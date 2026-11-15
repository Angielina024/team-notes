import { describe, it, expect } from 'vitest';
import { InMemoryNotesRepository } from '$lib/server/notes/in-memory-repository';
import { NotesService } from '$lib/server/notes/service';
import { makeUser } from '../factories';

const NOW = new Date('2026-03-01T09:00:00Z');

function setup() {
  const service = new NotesService(new InMemoryNotesRepository(), () => NOW);
  return { service, alice: makeUser({ name: 'Alice' }), bob: makeUser({ name: 'Bob' }) };
}

const draft = (title: string, tags: string[] = []) => ({ title, body: '', status: 'draft' as const, tags });
const firstPage = (tag?: string) => ({ tag, page: 1, limit: 20 });

describe('NotesService', () => {
  it('lists only the notes of the current user', async () => {
    const { service, alice, bob } = setup();
    await service.create(alice, draft('Alice note'));
    await service.create(bob, draft('Bob note'));

    const page = await service.list(alice, firstPage());

    expect(page.items.map((n) => n.title)).toEqual(['Alice note']);
  });

  it('stamps a new note with the current time', async () => {
    const { service, alice } = setup();

    const note = await service.create(alice, draft('Ранкова'));

    expect(note.createdAt).toBe('2026-03-01T09:00:00.000Z');
  });

  it("hides another author's draft", async () => {
    const { service, alice, bob } = setup();
    const note = await service.create(bob, draft('Секрет'));

    expect(await service.get(alice, note.id)).toBeNull();
    expect(await service.get(bob, note.id)).toEqual(note);
  });

  it('refuses to delete a note of another author', async () => {
    const { service, alice, bob } = setup();
    const note = await service.create(bob, draft('Bob note'));

    const deleted = await service.delete(alice, note.id);

    expect(deleted).toBe(false);
    expect(await service.get(bob, note.id)).not.toBeNull();
  });

  it('filters the list by tag', async () => {
    const { service, alice } = setup();
    await service.create(alice, draft('Звіт', ['work']));
    await service.create(alice, draft('Рецепт', ['home']));

    const page = await service.list(alice, firstPage('work'));

    expect(page.items.map((n) => n.title)).toEqual(['Звіт']);
  });

  it('returns null for a malformed id', async () => {
    const { service, alice } = setup();

    expect(await service.get(alice, 'nope')).toBeNull();
  });
});