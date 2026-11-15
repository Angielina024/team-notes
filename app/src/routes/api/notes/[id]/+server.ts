import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { NoteIdSchema, NotePatchSchema, parseJsonBody } from '$lib/notes/schema';
import { requireUser } from '$lib/server/auth';
import { notesService } from '$lib/server/container';

const invalidId = () => json({ message: 'Note id must be a UUID' }, { status: 400 });
const notFound = () => json({ message: 'Note not found' }, { status: 404 });
const isValidId = (id: string) => NoteIdSchema.safeParse(id).success;

export const GET: RequestHandler = async ({ params, locals }) => {
  const user = requireUser(locals);
  if (!isValidId(params.id)) return invalidId();
  const note = await notesService.get(user, params.id);
  return note ? json(note) : notFound();
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const user = requireUser(locals);
  if (!isValidId(params.id)) return invalidId();
  const parsed = await parseJsonBody(request, NotePatchSchema);
  if (!parsed.ok) return json(parsed.error, { status: parsed.error.status });

  const note = await notesService.update(user, params.id, parsed.value);
  return note ? json(note) : notFound();
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = requireUser(locals);
  if (!isValidId(params.id)) return invalidId();
  const deleted = await notesService.delete(user, params.id);
  return deleted ? new Response(null, { status: 204 }) : notFound();
};