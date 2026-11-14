<script lang="ts">
    import { page } from '$app/state';
  </script>
  
  <svelte:head>
    <title>{page.status} · Team Notes</title>
  </svelte:head>
  
  <main class="mx-auto mt-16 max-w-lg px-4 text-center text-neutral-900 dark:text-neutral-100">
    <p class="text-5xl font-bold text-neutral-400 dark:text-neutral-600">{page.status}</p>
    <h1 class="mt-2 text-2xl font-semibold">
      {page.status === 404 ? 'Нічого не знайдено' : 'Щось пішло не так'}
    </h1>
    <p class="mt-2 text-neutral-700 dark:text-neutral-300">{page.error?.message}</p>
    <a href="/notes" class="mt-6 inline-block text-blue-700 underline dark:text-blue-300">До нотаток</a>
  </main>