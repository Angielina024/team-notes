import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth';
import { getNote } from '$lib/server/store';

export const load: PageServerLoad = async ({ locals, params }) => {
  const user = requireUser(locals);
  const note = getNote(params.id);
  if (!note || note.authorId !== user.id) error(404, 'Нотатку не знайдено');
  return { note };
};