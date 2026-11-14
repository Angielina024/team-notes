import { z } from 'zod';
import type { Result } from './types';
import { parseTagList } from './tags';
import { BODY_MAX_LENGTH, MAX_TAGS_PER_NOTE, TAG_MAX_LENGTH, TITLE_MAX_LENGTH } from '../domain';

const title = z.string().trim().min(1, 'Title is required').max(TITLE_MAX_LENGTH, 'Title is too long');
const body = z.string().max(BODY_MAX_LENGTH, 'Body is too long');
const status = z.enum(['draft', 'published', 'archived']);
const tags = z.array(z.string().trim().toLowerCase().min(1).max(TAG_MAX_LENGTH)).max(MAX_TAGS_PER_NOTE, `At most ${MAX_TAGS_PER_NOTE} tags`);

export const NoteIdSchema = z.string().uuid();

export const NoteCreateSchema = z.object({
  title,
  body: body.default(''),
  status: status.default('draft'),
  tags: tags.default([])
});

export const NotePatchSchema = z
  .object({ title, body, status, tags })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, 'Nothing to update');

export const ListQuerySchema = z.object({
  tag: z.string().trim().toLowerCase().min(1).max(30).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type NoteCreate = z.infer<typeof NoteCreateSchema>;
export type NotePatch = z.infer<typeof NotePatchSchema>;
export type ListQuery = z.infer<typeof ListQuerySchema>;

export interface FieldIssue {
  path: string;
  message: string;
}

export interface ApiError {
  status: 400 | 415 | 422;
  message: string;
  issues?: FieldIssue[];
}

export function toFieldIssues(error: z.ZodError): FieldIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message
  }));
}

export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S
): Promise<Result<z.output<S>, ApiError>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.startsWith('application/json')) {
    return { ok: false, error: { status: 415, message: 'Expected Content-Type: application/json' } };
  }

  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return { ok: false, error: { status: 400, message: 'Body is not valid JSON' } };
  }

  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      ok: false,
      error: { status: 422, message: 'Validation failed', issues: toFieldIssues(result.error) }
    };
  }
  return { ok: true, value: result.data };
}

const BCRYPT_MAX_BYTES = 72;

const password = z
  .string()
  .min(8, 'Password must have at least 8 characters')
  .refine((value) => new TextEncoder().encode(value).length <= BCRYPT_MAX_BYTES, 'Password is too long');

export const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  name: z.string().trim().min(1, 'Name is required').max(100),
  password
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1).max(254),
  password: z.string().min(1).max(200)
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const noteFormSchema = z.object({
  title: z.string().trim().min(1, 'Вкажи заголовок').max(TITLE_MAX_LENGTH, `Заголовок: до ${TITLE_MAX_LENGTH} символів`),
  body: z.string().trim().max(BODY_MAX_LENGTH, `Текст: до ${BODY_MAX_LENGTH} символів`),
  tags: z
    .string()
    .transform(parseTagList)
    .pipe(
      z.array(z.string().max(TAG_MAX_LENGTH, `Тег: до ${TAG_MAX_LENGTH} символів`))
        .max(MAX_TAGS_PER_NOTE, `Не більше ${MAX_TAGS_PER_NOTE} тегів`)
    ),
});

export type FieldErrors = Partial<Record<string, string>>;

type Issue = { path: readonly PropertyKey[]; message: string };

export function toFieldErrors(issues: readonly Issue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? 'form');
    errors[field] ??= issue.message;
  }
  return errors;
}
