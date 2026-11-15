import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { noteFormSchema, toFieldErrors } from '$lib/notes/schema';
import { requireUser } from '$lib/server/auth';
import { notesService } from '$lib/server/container';

const PAGE_SIZE = 12;

function parsePage(raw: string | null): number {
  const page = Number(raw ?? '1');
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = requireUser(locals);
  const page = parsePage(url.searchParams.get('page'));
  const tag = url.searchParams.get('tag')?.trim().toLowerCase() || undefined;

  const [result, tagCounts] = await Promise.all([
    notesService.list(user, { tag, page, limit: PAGE_SIZE }),
    notesService.tagCounts(user),
  ]);

  return {
    notes: result.items,
    page,
    tag: tag ?? null,
    totalPages: Math.max(1, Math.ceil(result.total / PAGE_SIZE)),
    tagCounts,
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    const user = requireUser(locals);
    const formData = await request.formData();
    const values = {
      title: String(formData.get('title') ?? ''),
      body: String(formData.get('body') ?? ''),
      tags: String(formData.get('tags') ?? ''),
    };

    const parsed = noteFormSchema.safeParse(values);
    if (!parsed.success) {
      return fail(422, { errors: toFieldErrors(parsed.error.issues), values });
    }

    const note = await notesService.create(user, { ...parsed.data, status: 'draft' });
    redirect(303, `/notes/${note.id}`);
  },

  delete: async ({ request, locals }) => {
    const user = requireUser(locals);
    const id = String((await request.formData()).get('id') ?? '');
    const deleted = await notesService.delete(user, id);
    if (!deleted) error(404, 'Нотатку не знайдено');

    redirect(303, '/notes');
  },
} satisfies Actions;