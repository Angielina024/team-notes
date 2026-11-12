import { debounce } from './notes/fn';
import { fetchJson, HttpError, isAbortError, isTimeoutError } from './notes/http';
import { parseNote } from './notes/parse-note';
import { queryRequired, renderNotes, type NotesView } from './notes/render';
import type { Note } from './notes/types';
 
const API_URL = 'http://localhost:3000';
const SEARCH_DEBOUNCE_MS = 300;

import './style.css';

const view: NotesView = {
  root: queryRequired('#notes-root', HTMLElement),
  status: queryRequired('#notes-status', HTMLElement),
  list: queryRequired('#notes-list', HTMLUListElement),
}

const searchInput = queryRequired('#search', HTMLInputElement);
const alertBox = queryRequired('#notes-alert', HTMLElement);

let notes: Note[] = [];
let currentQuery = '';
let activeRequest: AbortController | null = null;

function notesUrl(query: string): string {
  const params = new URLSearchParams({ _sort: '-updatedAt' });
  if (query !== '') {
    const where = { or: [{ title: { contains: query } }, { body: { contains: query } }] };
    params.set('_where', JSON.stringify(where));
  }
  return `${API_URL}/notes?${params}`;
}

function toNotes(data: unknown): Note[] {
  if (!Array.isArray(data)) throw new Error('сервер повернув не список');
  const items: unknown[] = data;
  const result: Note[] = [];
  for (const item of items) {
    const parsed = parseNote(item);
    if (parsed.ok) result.push(parsed.value);
    else console.warn('Пропускаю некоректну нотатку:', parsed.error, item);
  }
  return result;
}

function describeError(error: unknown): string {
  if (error instanceof HttpError) return `сервер відповів ${error.status}`;
  if (isTimeoutError(error)) return 'сервер не відповів вчасно';
  if (error instanceof TypeError) return 'немає з’єднання з сервером';
  if (error instanceof Error) return error.message;
  return 'невідома помилка';
}

async function loadNotes(query: string): Promise<void> {
  activeRequest?.abort();
  const controller = new AbortController();
  activeRequest = controller;
  currentQuery = query;
  renderNotes(view, { kind: 'loading' });

  try {
    const data = await fetchJson<unknown>(notesUrl(query), { signal: controller.signal });
    if (controller.signal.aborted) return;
    notes = toNotes(data);
    renderNotes(view, { kind: 'ready', notes, query });
  } catch (error) {
    if (isAbortError(error)) return;
    console.error(error);
    renderNotes(view, { kind: 'error', message: describeError(error) });
  } finally {
    if (activeRequest === controller) activeRequest = null;
  }
}

const root = document.documentElement;

const themeToggle = document.querySelector<HTMLButtonElement>('#theme-toggle');
if (themeToggle) {
  themeToggle.setAttribute('aria-pressed', String(root.classList.contains('dark')));
  themeToggle.addEventListener('click', () => {
    const isDark = root.classList.toggle('dark');
    themeToggle.setAttribute('aria-pressed', String(isDark));
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

const menuButton = document.querySelector<HTMLButtonElement>('#menu-button');
const mobileMenu = document.querySelector<HTMLElement>('#mobile-menu');
if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    mobileMenu.classList.toggle('hidden', isOpen);
  });
}

type Field = HTMLInputElement | HTMLTextAreaElement;

function errorText(field: Field): string {
  if (field.validity.valueMissing) return field.dataset.errorMissing ?? 'Заповни це поле.';
  if (field.validity.tooShort) return `Потрібно щонайменше ${field.minLength} символів.`;
  return '';
}

function validate(field: Field): boolean {
  const message = errorText(field);
  const error = document.getElementById(`${field.id}-error`);
  if (error) error.textContent = message;
  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
  return message === '';
}

const form = document.querySelector<HTMLFormElement>('#new-note');
const formStatus = document.querySelector<HTMLElement>('#form-status');
if (form && formStatus) {
  form.noValidate = true;
  const fields = Array.from(form.querySelectorAll<Field>('[required]'));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const invalid = fields.filter((field) => !validate(field));
    if (invalid.length > 0) {
      formStatus.textContent = '';
      invalid[0]?.focus();
      return;
    }
    formStatus.textContent = 'Нотатку збережено (демо: дані нікуди не надсилаються).';
    form.reset();
  });

  form.addEventListener('input', (event) => {
    const target = event.target;
    const isField = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    if (isField && target.getAttribute('aria-invalid') === 'true') validate(target);
  });
}

  async function deleteNote(id: string, button: HTMLButtonElement): Promise<void> {
    button.disabled = true;
    alertBox.textContent = '';
    try {
      await fetchJson(`${API_URL}/notes/${encodeURIComponent(id)}`, { method: 'DELETE' });
      notes = notes.filter((note) => note.id !== id);
      renderNotes(view, { kind: 'ready', notes, query: currentQuery });
    } catch (error) {
      button.disabled = false;
      alertBox.textContent = `Не вдалося видалити нотатку: ${describeError(error)}.`;
    }
  }

  view.root.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('button[data-action]');
    if (!button || !view.root.contains(button)) return;
  
    if (button.dataset.action === 'retry') {
      void loadNotes(currentQuery);
    } else if (button.dataset.action === 'delete') {
      const id = button.closest<HTMLElement>('[data-id]')?.dataset.id;
      if (id) void deleteNote(id, button);
    }
  })

  const searchDebounced = debounce((query: string) => {
    void loadNotes(query);
  }, SEARCH_DEBOUNCE_MS);
  
  searchInput.addEventListener('input', () => {
    searchDebounced(searchInput.value.trim());
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Необроблена помилка в Promise:', event.reason);
  });

  void loadNotes('');