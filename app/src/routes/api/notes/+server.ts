import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ListQuerySchema, NoteCreateSchema, parseJsonBody, toFieldIssues } from '$lib/notes/schema';
import { DEMO_AUTHOR_ID, createNote, listNotes } from '$lib/server/store';

export const GET: RequestHandler = ({ url }) => {
  const query = ListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!query.success) {
    return json(
      { message: 'Invalid query parameters', issues: toFieldIssues(query.error) },
      { status: 400 }
    );
  }
  return json(listNotes(query.data));
};

export const POST: RequestHandler = async ({ request }) => {
  const parsed = await parseJsonBody(request, NoteCreateSchema);
  if (!parsed.ok) return json(parsed.error, { status: parsed.error.status });

  const note = createNote(parsed.value, DEMO_AUTHOR_ID);
  return json(note, { status: 201, headers: { Location: `/api/notes/${note.id}` } });
};