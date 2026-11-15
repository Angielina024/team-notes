-- db/seed.sql — 200 користувачів і 100 000 нотаток для дослідів (лише для розробки!)
TRUNCATE users, sessions, notes, comments, tags, note_tags RESTART IDENTITY CASCADE;

INSERT INTO users (email, name, password_hash)
SELECT 'user' || i || '@example.com', 'User ' || i, 'not-a-real-hash'
FROM generate_series(1, 200) AS i;

INSERT INTO notes (author_id, title, status, created_at, updated_at)
SELECT author_id, title, 'draft', t, t
FROM (
  SELECT u.ids[1 + g % 200]                     AS author_id,
         'Нотатка №' || g                        AS title,
         now() - random() * interval '365 days'  AS t
  FROM (SELECT array_agg(id) AS ids FROM users) AS u,
       generate_series(1, 100000) AS g
) AS s;

ANALYZE;