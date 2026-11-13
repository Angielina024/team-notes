import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { NoteIdSchema, NotePatchSchema, parseJsonBody } from '$lib/notes/schema';
import { deleteNote, getNote, updateNote } from '$lib/server/store';

const invalidId = () => json({ message: 'Note id must be a UUID' }, { status: 400 });
const notFound = () => json({ message: 'Note not found' }, { status: 404 });
const isValidId = (id: string) => NoteIdSchema.safeParse(id).success;

export const GET: RequestHandler = ({ params }) => {
  if (!isValidId(params.id)) return invalidId();
  const note = getNote(params.id);
  return note ? json(note) : notFound();
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  if (!isValidId(params.id)) return invalidId();
  if (!getNote(params.id)) return notFound();

  const parsed = await parseJsonBody(request, NotePatchSchema);
  if (!parsed.ok) return json(parsed.error, { status: parsed.error.status });

  const note = updateNote(params.id, parsed.value);
  return note ? json(note) : notFound();
};

export const DELETE: RequestHandler = ({ params }) => {
  if (!isValidId(params.id)) return invalidId();
  return deleteNote(params.id) ? new Response(null, { status: 204 }) : notFound();
};