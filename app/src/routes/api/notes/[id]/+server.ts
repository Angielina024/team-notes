import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Note } from '$lib/notes/types';
import { NoteIdSchema, NotePatchSchema, parseJsonBody } from '$lib/notes/schema';
import { requireUser } from '$lib/server/auth';
import { deleteNote, getNote, updateNote } from '$lib/server/store';
import { canEdit, canView } from '$lib/domain';

const invalidId = () => json({ message: 'Note id must be a UUID' }, { status: 400 });
const notFound = () => json({ message: 'Note not found' }, { status: 404 });
const isValidId = (id: string) => NoteIdSchema.safeParse(id).success;

function findOwnNote(id: string, userId: string): Note | undefined {
  const note = getNote(id);
  return note && canEdit(note, { id: userId }) ? note : undefined;
}

export const GET: RequestHandler = ({ params, locals }) => {
  const user = requireUser(locals);
  if (!isValidId(params.id)) return invalidId();
  const note = getNote(params.id);
  return note && canView(note, user) ? json(note) : notFound();
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const user = requireUser(locals);
  if (!isValidId(params.id)) return invalidId();
  if (!findOwnNote(params.id, user.id)) return notFound();

  const parsed = await parseJsonBody(request, NotePatchSchema);
  if (!parsed.ok) return json(parsed.error, { status: parsed.error.status });

  const note = updateNote(params.id, parsed.value);
  return note ? json(note) : notFound();
};

export const DELETE: RequestHandler = ({ params, locals }) => {
  const user = requireUser(locals);
  if (!isValidId(params.id)) return invalidId();
  if (!findOwnNote(params.id, user.id)) return notFound();

  deleteNote(params.id);
  return new Response(null, { status: 204 });
};
