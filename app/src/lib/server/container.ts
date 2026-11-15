import { env } from '$env/dynamic/private';
import { createSql } from './db';
import { PostgresNotesRepository } from './notes/postgres-repository';
import { NotesService } from './notes/service';
import { PostgresUsersRepository } from './users/repository';

export const sql = createSql(env.DATABASE_URL);
export const notesService = new NotesService(new PostgresNotesRepository(sql));
export const usersRepository = new PostgresUsersRepository(sql);