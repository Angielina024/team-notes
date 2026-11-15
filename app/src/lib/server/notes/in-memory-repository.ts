import type { Note } from '$lib/notes/types';
import type { NewNote, NoteChanges, NoteFilter, NotesRepository, Page, PageRequest } from './repository';

export class InMemoryNotesRepository implements NotesRepository {
  private notes = new Map<string, Note>();

  async list({ authorId, tag }: NoteFilter, { page, limit }: PageRequest): Promise<Page<Note>> {
    const matching = [...this.notes.values()]
      .filter((note) => note.authorId === authorId)
      .filter((note) => !tag || note.tags.includes(tag))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const start = (page - 1) * limit;
    return { items: matching.slice(start, start + limit), page, limit, total: matching.length };
  }

  async findById(id: string): Promise<Note | null> {
    return this.notes.get(id) ?? null;
  }

  async insert(data: NewNote): Promise<Note> {
    const note: Note = { id: crypto.randomUUID(), ...data };
    this.notes.set(note.id, note);
    return note;
  }

  async update(id: string, changes: NoteChanges): Promise<Note | null> {
    const current = this.notes.get(id);
    if (!current) return null;
    const next: Note = { ...current, ...changes };
    this.notes.set(id, next);
    return next;
  }

  async delete(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }
}