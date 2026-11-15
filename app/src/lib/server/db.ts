import postgres, { type Sql } from 'postgres';

const POOL_SIZE = 10;

/** З'єднання з базою або транзакція: допоміжні функції працюють з обома. */
export type Db = Sql | postgres.TransactionSql;

export function createSql(databaseUrl: string | undefined): Sql {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set, e.g. postgres://postgres:devpass@localhost:5432/team_notes');
  }
  return postgres(databaseUrl, { max: POOL_SIZE, onnotice: () => {} });
}