import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { noteFormSchema, toFieldErrors } from '$lib/notes/schema';
import { requireUser } from '$lib/server/auth';
import { createNote, deleteNote, getNote, listNotes } from '$lib/server/store';


const PAGE_SIZE = 12;

function parsePage(raw: string | null): number {
  const page = Number(raw ?? '1');
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export const load: PageServerLoad = async ({ locals, url }) => {
    const user = requireUser(locals);
    const page = parsePage(url.searchParams.get('page'));
    const tag = url.searchParams.get('tag')?.trim().toLowerCase() || undefined;
    const { items, total } = listNotes({ authorId: user.id, tag, page, limit: PAGE_SIZE });
  
    return {
      notes: items,
      page,
      tag: tag ?? null,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
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
  
      const note = createNote({ ...parsed.data, status: 'draft' }, user.id);
      redirect(303, `/notes/${note.id}`);
    },
  
    delete: async ({ request, locals }) => {
      const user = requireUser(locals);
      const id = String((await request.formData()).get('id') ?? '');
      const note = getNote(id);
      if (!note || note.authorId !== user.id) error(404, 'Нотатку не знайдено');
  
      deleteNote(note.id);
      redirect(303, '/notes');
    },
  } satisfies Actions;
