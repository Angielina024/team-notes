import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { error, type Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { User } from '$lib/notes/types';
import type { RegisterInput } from '$lib/notes/schema';

export const SESSION_COOKIE = 'session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_COST = 12;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 60 * 1000;

interface UserRecord extends User {
  passwordHash: string;
}

interface Session {
  userId: string;
  expiresAt: number;
}

const usersById = new Map<string, UserRecord>();
const userIdByEmail = new Map<string, string>();
const sessions = new Map<string, Session>(); // key: sha256(token)
const loginAttempts = new Map<string, number[]>(); // key: IP

const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_COST);

function toPublicUser({ id, email, name }: UserRecord): User {
  return { id, email, name };
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// ---------- users and passwords ----------

export async function registerUser(input: RegisterInput): Promise<User | null> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  if (userIdByEmail.has(input.email)) return null;

  const record: UserRecord = { id: crypto.randomUUID(), email: input.email, name: input.name, passwordHash };
  usersById.set(record.id, record);
  userIdByEmail.set(record.email, record.id);
  return toPublicUser(record);
}

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const userId = userIdByEmail.get(email);
  const record = userId ? usersById.get(userId) : undefined;
  const passwordMatches = await bcrypt.compare(password, record?.passwordHash ?? DUMMY_HASH);
  return record && passwordMatches ? toPublicUser(record) : null;
}

export function findUserById(id: string): User | null {
  const record = usersById.get(id);
  return record ? toPublicUser(record) : null;
}

// ---------- sessions ----------

function createSession(userId: string): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(hashToken(token), { userId, expiresAt });
  return { token, expiresAt: new Date(expiresAt) };
}

export function validateSessionToken(token: string): User | null {
  const key = hashToken(token);
  const session = sessions.get(key);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(key);
    return null;
  }
  return findUserById(session.userId);
}

export function startSession(cookies: Cookies, userId: string): void {
  const { token, expiresAt } = createSession(userId);
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: !dev,
    expires: expiresAt
  });
}

export function endSession(cookies: Cookies): void {
  const token = cookies.get(SESSION_COOKIE);
  if (token) sessions.delete(hashToken(token));
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function endAllSessions(userId: string): number {
  let removed = 0;
  for (const [key, session] of sessions) {
    if (session.userId === userId) {
      sessions.delete(key);
      removed++;
    }
  }
  return removed;
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
