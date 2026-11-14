import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { endAllSessions, endSession } from '$lib/server/auth';

export const POST: RequestHandler = ({ cookies, locals, url }) => {
  if (url.searchParams.get('scope') === 'all') {
    if (!locals.user) return json({ message: 'Not authenticated' }, { status: 401 });
    endAllSessions(locals.user.id);
  }
  endSession(cookies);
  return new Response(null, { status: 204 });
};
