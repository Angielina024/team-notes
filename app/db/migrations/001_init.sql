-- 001_init.sql — схема Team Notes

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  name          text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- email унікальний без урахування регістру
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (lower(email));

CREATE TABLE IF NOT EXISTS sessions (
  id         text PRIMARY KEY,                -- sha256 від токена з cookie (день 6)
  -- сесія без користувача не має сенсу → CASCADE
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- автора з нотатками видалити не можна → RESTRICT
  author_id  uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  title      text NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  body       text NOT NULL DEFAULT '',
  status     text NOT NULL DEFAULT 'draft'
             CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- коментар без нотатки не має сенсу → CASCADE
  note_id    uuid NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  body       text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tags (
  id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE CHECK (name = lower(name) AND length(name) BETWEEN 1 AND 30)
);

CREATE TABLE IF NOT EXISTS note_tags (
  -- зв'язок живе, поки живі обидва кінці → CASCADE з обох боків
  note_id uuid   NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
  tag_id  bigint NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);