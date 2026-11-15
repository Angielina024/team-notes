import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ListQuerySchema, NoteCreateSchema, parseJsonBody, toFieldIssues } from '$lib/notes/schema';
import { requireUser } from '$lib/server/auth';
import { notesService } from '$lib/server/container';

export const GET: RequestHandler = async ({ url, locals }) => {
  const user = requireUser(locals);
  const query = ListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!query.success) {
    return json({ message: 'Invalid query parameters', issues: toFieldIssues(query.error) }, { status: 400 });
  }
  return json(await notesService.list(user, query.data));
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = requireUser(locals);
  const parsed = await parseJsonBody(request, NoteCreateSchema);
  if (!parsed.ok) return json(parsed.error, { status: parsed.error.status });

  const note = await notesService.create(user, parsed.value);
  return json(note, { status: 201, headers: { Location: `/api/notes/${note.id}` } });
};