import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { consumeLoginAttempt, endSession, startSession, verifyCredentials } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(303, '/notes');
};

export const actions = {
  login: async ({ request, cookies, getClientAddress }) => {
    const formData = await request.formData();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) {
      return fail(422, { email, message: 'Введи email і пароль' });
    }
    if (!consumeLoginAttempt(getClientAddress()).allowed) {
      return fail(429, { email, message: 'Забагато спроб. Спробуй за хвилину' });
    }
    const user = await verifyCredentials(email, password);
    if (!user) {
      return fail(400, { email, message: 'Невірний email або пароль' });
    }
    await startSession(cookies, user.id);
    redirect(303, '/notes');
  },

  logout: async ({ cookies }) => {
    await endSession(cookies);
    redirect(303, '/login');
  },
} satisfies Actions;