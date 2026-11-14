import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import type { RequestHandler } from './$types';
import { ListQuerySchema, NoteCreateSchema, parseJsonBody, toFieldIssues } from '$lib/notes/schema';
import { createNote, listNotes } from '$lib/server/store';

export const GET: RequestHandler = ({ url, locals }) => {
  requireUser(locals);
  const query = ListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!query.success) {
    return json(
      { message: 'Invalid query parameters', issues: toFieldIssues(query.error) },
      { status: 400 }
    );
  }
  return json(listNotes(query.data));
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = requireUser(locals);

  const parsed = await parseJsonBody(request, NoteCreateSchema);
  if (!parsed.ok) return json(parsed.error, { status: parsed.error.status });

  const note = createNote(parsed.value, user.id);

  return json(note, {
    status: 201,
    headers: { Location: `/api/notes/${note.id}` }
  });
};