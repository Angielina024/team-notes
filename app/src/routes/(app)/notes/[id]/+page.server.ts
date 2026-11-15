import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { canEdit } from '$lib/notes/domain';
import { requireUser } from '$lib/server/auth';
import { notesService } from '$lib/server/container';

export const load: PageServerLoad = async ({ locals, params }) => {
  const user = requireUser(locals);
  const note = await notesService.get(user, params.id);
  if (!note) error(404, 'Нотатку не знайдено');
  return { note, editable: canEdit(note, user) };
};

export const actions = {
  archive: async ({ locals, params }) => {
    const user = requireUser(locals);
    const note = await notesService.archive(user, params.id);
    if (!note) error(404, 'Нотатку не знайдено');
  },
} satisfies Actions;