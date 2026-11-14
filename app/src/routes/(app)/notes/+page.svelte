<script lang="ts">
    import type { PageProps } from './$types';
  
    let { data, form }: PageProps = $props();
  
    const field =
      'rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900';
    const errorText = 'text-sm text-red-700 dark:text-red-300';
    const card = 'rounded-lg border border-neutral-200 p-4 dark:border-neutral-800';

    function pageHref(page: number): string {
    const params = new URLSearchParams({ page: String(page) });
    if (data.tag) params.set('tag', data.tag);
    return `?${params}`;
    }
  </script>
  
  <svelte:head>
    <title>Нотатки · Team Notes</title>
  </svelte:head>
  
  <h1 class="mb-6 text-2xl font-semibold">Мої нотатки</h1>

  {#if data.tag}
  <p class="mb-4 text-sm">Фільтр: <strong>#{data.tag}</strong> · <a href="/notes" class="underline">скинути</a></p>
    {/if}
  
  <section aria-labelledby="new-note" class="mb-8 {card}">
    <h2 id="new-note" class="mb-3 text-lg font-medium">Нова нотатка</h2>
  
    <form method="POST" action="?/create" class="flex flex-col gap-2">
      <label for="title" class="text-sm font-medium">Заголовок</label>
      <input id="title" name="title" required maxlength="120" value={form?.values.title ?? ''} class={field}
        aria-invalid={form?.errors.title ? 'true' : undefined}
        aria-describedby={form?.errors.title ? 'title-error' : undefined} />
      {#if form?.errors.title}<p id="title-error" class={errorText}>{form.errors.title}</p>{/if}
  
      <label for="body" class="text-sm font-medium">Текст</label>
      <textarea id="body" name="body" rows="4" value={form?.values.body ?? ''} class={field}
        aria-invalid={form?.errors.body ? 'true' : undefined}
        aria-describedby={form?.errors.body ? 'body-error' : undefined}></textarea>
      {#if form?.errors.body}<p id="body-error" class={errorText}>{form.errors.body}</p>{/if}
  
      <label for="tags" class="text-sm font-medium">Теги</label>
      <input id="tags" name="tags" value={form?.values.tags ?? ''} class={field}
        aria-invalid={form?.errors.tags ? 'true' : undefined}
        aria-describedby={form?.errors.tags ? 'tags-hint tags-error' : 'tags-hint'} />
      <p id="tags-hint" class="text-sm text-neutral-600 dark:text-neutral-400">Через кому, наприклад: робота, ідеї</p>
      {#if form?.errors.tags}<p id="tags-error" class={errorText}>{form.errors.tags}</p>{/if}
  
      <button class="mt-2 self-start rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400">
        Зберегти
      </button>
    </form>
  </section>
  
  <section aria-labelledby="list-heading">
    <h2 id="list-heading" class="sr-only">Список нотаток</h2>
  
    {#if data.notes.length === 0}
      <p class="text-neutral-600 dark:text-neutral-400">Тут поки порожньо. Створи першу нотатку.</p>
    {:else}
      <ul class="grid gap-4 md:grid-cols-2">
        {#each data.notes as note (note.id)}
          <li>
            <article class={card}>
              <h3 class="truncate font-medium">
                <a href="/notes/{note.id}" class="hover:underline">{note.title}</a>
              </h3>
              <p class="line-clamp-3 text-sm text-neutral-700 dark:text-neutral-300">{note.body}</p>
              {#if note.tags.length > 0}
                <ul class="mt-2 flex flex-wrap gap-2 text-sm" aria-label="Теги">
                    {#each note.tags as tag}
                    <li>
                        <a href="?tag={encodeURIComponent(tag)}" class="rounded bg-neutral-100 px-2 py-0.5 hover:underline dark:bg-neutral-800">#{tag}</a>
                    </li>
                    {/each}
                </ul>
                {/if}
              <form method="POST" action="?/delete" class="mt-3">
                <input type="hidden" name="id" value={note.id} />
                <button class="text-sm text-red-700 hover:underline dark:text-red-300">
                  Видалити<span class="sr-only"> «{note.title}»</span>
                </button>
              </form>
            </article>
          </li>
        {/each}
      </ul>
    {/if}
  
    <nav aria-label="Сторінки" class="mt-6 flex items-center gap-4 text-sm">
      {#if data.page > 1}<a href={pageHref(data.page - 1)} rel="prev" class="underline">← Попередня</a>{/if}
      <span>Сторінка {data.page} з {data.totalPages}</span>
      {#if data.page < data.totalPages}<a href={pageHref(data.page + 1)} rel="next" class="underline">Наступна →</a>{/if}
    </nav>
  </section>