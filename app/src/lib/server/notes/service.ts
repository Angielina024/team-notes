import { archive, canEdit, canView, countTags, type TagCount } from '$lib/notes/domain';
import { NoteIdSchema, type ListQuery, type NoteCreate, type NotePatch } from '$lib/notes/schema';
import type { Note, User } from '$lib/notes/types';
import type { NotesRepository, Page } from './repository';

type Actor = Pick<User, 'id'>;

const TAG_CLOUD_SIZE = 100;

export class NotesService {
  private readonly repo: NotesRepository;
  private readonly now: () => Date;

  constructor(repo: NotesRepository, now: () => Date = () => new Date()) {
    this.repo = repo;
    this.now = now;
  }

  private async find(id: string): Promise<Note | null> {
    if (!NoteIdSchema.safeParse(id).success) return null;
    return this.repo.findById(id);
  }

  private async findEditable(user: Actor, id: string): Promise<Note | null> {
    const note = await this.find(id);
    return note && canEdit(note, user) ? note : null;
  }

  list(user: Actor, { tag, page, limit }: ListQuery): Promise<Page<Note>> {
    return this.repo.list({ authorId: user.id, tag }, { page, limit });
  }

  async tagCounts(user: Actor): Promise<TagCount[]> {
    const recent = await this.repo.list({ authorId: user.id }, { page: 1, limit: TAG_CLOUD_SIZE });
    return countTags(recent.items);
  }

  async get(user: Actor, id: string): Promise<Note | null> {
    const note = await this.find(id);
    return note && canView(note, user) ? note : null;
  }

  create(user: Actor, input: NoteCreate): Promise<Note> {
    const timestamp = this.now().toISOString();
    return this.repo.insert({ ...input, authorId: user.id, createdAt: timestamp, updatedAt: timestamp });
  }

  async update(user: Actor, id: string, patch: NotePatch): Promise<Note | null> {
    const note = await this.findEditable(user, id);
    if (!note) return null;
    return this.repo.update(note.id, { ...patch, updatedAt: this.now().toISOString() });
  }

  async archive(user: Actor, id: string): Promise<Note | null> {
    const note = await this.findEditable(user, id);
    if (!note) return null;
    const archived = archive(note, this.now());
    if (archived === note) return note;
    return this.repo.update(note.id, { status: archived.status, updatedAt: archived.updatedAt });
  }

  async delete(user: Actor, id: string): Promise<boolean> {
    const note = await this.findEditable(user, id);
    if (!note) return false;
    return this.repo.delete(note.id);
  }
}