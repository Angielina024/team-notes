export type NoteStatus = 'draft' | 'published' | 'archived';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Note {
  id: string;
  authorId: string;
  title: string;
  body: string;
  status: NoteStatus;
  tags: string[];
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface Comment {
  id: string;
  noteId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export interface Tag {
    id: string;
    name: string;
  }; 

  