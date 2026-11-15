import { createHash, randomBytes } from 'node:crypto';
import type { Sql } from 'postgres';
import type { User } from '$lib/notes/types';

const SESSION_TTL_DAYS = 7;

// у базі лежить лише хеш: навіть якщо таблицю вкрадуть, сесії не підробиш
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(sql: Sql, userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const [row] = await sql<{ expires_at: Date }[]>`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, now() + make_interval(days => ${SESSION_TTL_DAYS}))
    RETURNING expires_at`;
  return { token, expiresAt: new Date(row!.expires_at) };
}

export async function findSessionUser(sql: Sql, token: string): Promise<User | null> {
  const [user] = await sql<User[]>`
    SELECT u.id, u.email, u.name
    FROM sessions AS s JOIN users AS u ON u.id = s.user_id
    WHERE s.id = ${hashToken(token)} AND s.expires_at > now()`;
  return user ?? null;
}

export async function deleteSession(sql: Sql, token: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE id = ${hashToken(token)}`;
}

export async function deleteAllSessions(sql: Sql, userId: string): Promise<number> {
  const result = await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
  return result.count;
}