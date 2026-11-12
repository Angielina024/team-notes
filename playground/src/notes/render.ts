import type { Note, NoteStatus } from "./types";

export type NotesViewState = {kind: 'loading'} | {kind: 'error', message: string} | {kind: 'ready', notes: readonly Note[], query: string};

export interface NotesView {
    root: HTMLElement;
    status: HTMLElement;
    list: HTMLElement;
}

const STATUS_LABELS = {'draft': 'Чернетка', 'published': 'Опубліковано', 'archived': 'В архіві'} satisfies Record<NoteStatus, string>;

const dateFormat = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });

export function queryRequired<T extends Element>(selector: string, type: new () => T): T {
    const element = document.querySelector(selector);
    if(!(element instanceof type)) {
        throw new Error(`${selector} не знайдено.`)
    }
    return element;
}

export function renderNotes(view: NotesView, state: NotesViewState): void {
    view.root.setAttribute('aria-busy', String(state.kind === 'loading'));

    switch (state.kind) {
        case 'loading': 
            view.status.textContent = 'Завантаження...';
            view.list.replaceChildren();
            return;
        case "error":
            view.status.replaceChildren(`Не вдалося завантажити нотатки: ${state.message}. `, createButton('Спробувати ще', 'retry'));
            view.list.replaceChildren();
            return;
        case "ready":
            view.status.textContent = (state.notes.length === 0) ? emptyMessage(state.query) : `Нотаток: ${state.notes.length}`;
            const fragment = document.createDocumentFragment();
            for (const note of state.notes) {
                createNoteCard(note);
                fragment.append(createNoteCard(note));
            }
                view.list.replaceChildren(fragment);
                return;
        default: assertNever(state);
            }
    }

function emptyMessage(query: string): string {
    if(query === '') {
        return 'Нотаток ще немає.';
    }
    return `За запитом «${query}» нічого не знайдено.`;
}

function assertNever(value: never): never {
    throw new Error(`Непередбачений стан: ${JSON.stringify(value)}`);
}

function createButton(label: string, action: 'retry' | 'delete'): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = action;
    button.textContent = label;
    button.className = 'self-start rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 focus-visible:outline-2 dark:border-neutral-600 dark:hover:bg-neutral-800';
    return button;
}

export function createNoteCard(note: Note): HTMLLIElement {
    const item = document.createElement('li');
    item.dataset.id = note.id;

    const article = document.createElement('article');
    article.className = 'flex h-full flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900';
    
    const title = document.createElement('h3');
    title.className = 'truncate font-semibold text-neutral-900 dark:text-neutral-100';
    title.textContent = note.title;

    const body = document.createElement('p');
    body.className = 'line-clamp-3 text-neutral-700 dark:text-neutral-300';
    body.textContent = note.body;

    const meta = document.createElement('p');
    meta.className = 'text-sm text-neutral-500 dark:text-neutral-400';

    const time = document.createElement('time');
    time.dateTime = note.updatedAt;
    time.textContent = dateFormat.format(new Date(note.updatedAt));
    meta.append(`${STATUS_LABELS[note.status]} · `, time);

    const tags = document.createElement('ul');
    tags.className = 'flex flex-wrap gap-1';
    tags.setAttribute('aria-label', 'Теги');
    for (const tag of note.tags) {
        const tagItem = document.createElement('li');
        tagItem.className = 'rounded bg-neutral-100 px-2 text-sm dark:bg-neutral-800';
        tagItem.textContent = `#${tag}`;
        tags.append(tagItem);}

    const remove = createButton('Видалити', 'delete');
    remove.setAttribute('aria-label', `Видалити нотатку «${note.title}»`);
      
    article.append(title, body, meta, tags, remove);
    item.append(article);
    return item;
}
