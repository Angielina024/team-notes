import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RegisterSchema, parseJsonBody } from '$lib/notes/schema';
import { registerUser, startSession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const parsed = await parseJsonBody(request, RegisterSchema);
  if (!parsed.ok) return json(parsed.error, { status: parsed.error.status });

  const user = await registerUser(parsed.value);
  if (!user) return json({ message: 'Email is already registered' }, { status: 409 });

  startSession(cookies, user.id);
  return json(user, { status: 201 });
};
