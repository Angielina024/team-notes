<script lang="ts">
    import type { PageProps } from './$types';

    import { enhance } from '$app/forms';
  
    let { data }: PageProps = $props();
  
    const dateFormat = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });
  </script>
  
  <svelte:head>
    <title>{data.note.title} · Team Notes</title>
  </svelte:head>
  
  <p class="mb-4 text-sm"><a href="/notes" class="underline">← Усі нотатки</a></p>
  
  <article class="flex flex-col gap-3">
    <h1 class="text-2xl font-semibold">{data.note.title}</h1>
    <p class="text-sm text-neutral-600 dark:text-neutral-400">
      Оновлено <time datetime={data.note.updatedAt}>{dateFormat.format(new Date(data.note.updatedAt))}</time>
      · {data.note.status}
    </p>
    {#if data.note.tags.length > 0}
      <ul class="flex flex-wrap gap-2" aria-label="Теги">
        {#each data.note.tags as tag}
          <li class="rounded bg-neutral-100 px-2 py-0.5 text-sm dark:bg-neutral-800">#{tag}</li>
        {/each}
      </ul>
    {/if}
    <p class="whitespace-pre-line">{data.note.body}</p>
  
    {#if data.editable}
  <div class="flex gap-4">
    {#if data.note.status !== 'archived'}
      <form method="POST" action="?/archive" use:enhance>
        <button class="text-sm underline hover:no-underline">Архівувати</button>
      </form>
    {/if}
    <form method="POST" action="/notes?/delete" use:enhance>
      <input type="hidden" name="id" value={data.note.id} />
      <button class="text-sm text-red-700 hover:underline dark:text-red-300">Видалити нотатку</button>
    </form>
  </div>
{/if}
  </article>