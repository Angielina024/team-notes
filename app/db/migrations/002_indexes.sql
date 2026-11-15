-- головний запит: нотатки автора, найновіші першими
CREATE INDEX IF NOT EXISTS notes_author_updated_idx ON notes (author_id, updated_at DESC);
-- індекси на foreign keys: для JOIN і ON DELETE
CREATE INDEX IF NOT EXISTS note_tags_tag_id_idx   ON note_tags (tag_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx   ON sessions (user_id);
CREATE INDEX IF NOT EXISTS comments_note_id_idx   ON comments (note_id);