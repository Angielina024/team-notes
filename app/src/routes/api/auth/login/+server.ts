import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { LoginSchema, parseJsonBody } from '$lib/notes/schema';
import { consumeLoginAttempt, startSession, verifyCredentials } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const limit = consumeLoginAttempt(getClientAddress());
  if (!limit.allowed) {
    return json(
      { message: 'Too many login attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const parsed = await parseJsonBody(request, LoginSchema);
  if (!parsed.ok) return json(parsed.error, { status: parsed.error.status });

  const user = await verifyCredentials(parsed.value.email, parsed.value.password);
  if (!user) return json({ message: 'Invalid email or password' }, { status: 401 });

  startSession(cookies, user.id);
  return json(user);
};
