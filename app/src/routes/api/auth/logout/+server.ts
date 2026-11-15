import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { endAllSessions, endSession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies, locals, url }) => {
  if (url.searchParams.get('scope') === 'all') {
    if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });
    await endAllSessions(locals.user.id);
  }
  await endSession(cookies);
  return new Response(null, { status: 204 });
};
