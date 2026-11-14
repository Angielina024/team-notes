import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { archive, canEdit, canView } from '$lib/domain';
import { requireUser } from '$lib/server/auth';
import { getNote, updateNote } from '$lib/server/store';

export const load: PageServerLoad = async ({ locals, params }) => {
  const user = requireUser(locals);
  const note = getNote(params.id);
  if (!note || !canView(note, user)) error(404, 'Нотатку не знайдено');
  return { note, editable: canEdit(note, user) };
};

export const actions = {
  archive: async ({ locals, params }) => {
    const user = requireUser(locals);
    const note = getNote(params.id);
    if (!note || !canEdit(note, user)) error(404, 'Нотатку не знайдено');

    const archived = archive(note, new Date());
    updateNote(note.id, { status: archived.status });
  },
} satisfies Actions;