import { InMemoryNotesRepository } from './notes/in-memory-repository';
import { NotesService } from './notes/service';

// Єдине місце, де вирішуємо, яке сховище використовує застосунок.
export const notesService = new NotesService(new InMemoryNotesRepository());