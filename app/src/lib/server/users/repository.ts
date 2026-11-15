import type { Sql } from 'postgres';
import type { User } from '$lib/notes/types';

export interface UserWithHash extends User {
  passwordHash: string;
}

export class PostgresUsersRepository {
  private readonly sql: Sql;

  constructor(sql: Sql) {
    this.sql = sql;
  }

  async findByEmailWithHash(email: string): Promise<UserWithHash | null> {
    const [row] = await this.sql<UserWithHash[]>`
      SELECT id, email, name, password_hash AS "passwordHash"
      FROM users WHERE lower(email) = lower(${email})`;
    return row ?? null;
  }

  async create(input: { email: string; name: string; passwordHash: string }): Promise<User> {
    const [user] = await this.sql<User[]>`
      INSERT INTO users (email, name, password_hash)
      VALUES (${input.email}, ${input.name}, ${input.passwordHash})
      RETURNING id, email, name`;
    if (!user) throw new Error('INSERT returned no row');
    return user;
  }
}