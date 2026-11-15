import bcrypt from 'bcryptjs';
import { error, type Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { User } from '$lib/notes/types';
import type { RegisterInput } from '$lib/notes/schema';
import { sql, usersRepository } from './container';
import { createSession, deleteAllSessions, deleteSession, findSessionUser } from './sessions';

export const SESSION_COOKIE = 'session';
const BCRYPT_COST = 12;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 60 * 1000;
const UNIQUE_VIOLATION = '23505'; // код помилки PostgreSQL «порушено UNIQUE»

const loginAttempts = new Map<string, number[]>(); // key: IP

const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_COST);

// ---------- users and passwords ----------

export async function registerUser(input: RegisterInput): Promise<User | null> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  try {
    return await usersRepository.create({ email: input.email, name: input.name, passwordHash });
  } catch (cause) {
    // email уже зайнятий: це перевіряє UNIQUE-індекс у базі
    if ((cause as { code?: string }).code === UNIQUE_VIOLATION) return null;
    throw cause;
  }
}

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const record = await usersRepository.findByEmailWithHash(email);
  const passwordMatches = await bcrypt.compare(password, record?.passwordHash ?? DUMMY_HASH);
  return record && passwordMatches ? { id: record.id, email: record.email, name: record.name } : null;
}

// ---------- sessions ----------

export function validateSessionToken(token: string): Promise<User | null> {
  return findSessionUser(sql, token);
}

export async function startSession(cookies: Cookies, userId: string): Promise<void> {
  const { token, expiresAt } = await createSession(sql, userId);
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: !dev,
    expires: expiresAt,
  });
}

export async function endSession(cookies: Cookies): Promise<void> {
  const token = cookies.get(SESSION_COOKIE);
  if (token) await deleteSession(sql, token);
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function endAllSessions(userId: string): Promise<number> {
  return deleteAllSessions(sql, userId);
}

export function requireUser(locals: App.Locals): User {
  if (!locals.user) error(401, 'Not authenticated');
  return locals.user;
}

// ---------- rate limit ----------

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSec: number };

export function consumeLoginAttempt(ip: string, now = Date.now()): RateLimitResult {
  const windowStart = now - LOGIN_WINDOW_MS;
  const recent = (loginAttempts.get(ip) ?? []).filter((time) => time > windowStart);

  if (recent.length >= LOGIN_MAX_ATTEMPTS) {
    loginAttempts.set(ip, recent);
    const oldest = recent[0] ?? now;
    return { allowed: false, retryAfterSec: Math.ceil((oldest + LOGIN_WINDOW_MS - now) / 1000) };
  }

  recent.push(now);
  loginAttempts.set(ip, recent);
  return { allowed: true };
}
