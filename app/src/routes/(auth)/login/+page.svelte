<script lang="ts">
    import type { PageProps } from './$types';
  
    let { form }: PageProps = $props();
  
    const field =
      'rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900';
  </script>
  
  <svelte:head>
    <title>Вхід · Team Notes</title>
  </svelte:head>
  
  <main class="mx-auto mt-16 max-w-sm px-4 text-neutral-900 dark:text-neutral-100">
    <h1 class="mb-6 text-2xl font-semibold">Вхід</h1>
  
    {#if form?.message}
      <p role="alert" class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
        {form.message}
      </p>
    {/if}
  
    <form method="POST" action="?/login" class="flex flex-col gap-4">
      <label class="flex flex-col gap-1 text-sm font-medium">
        Email <input name="email" type="email" autocomplete="email" required value={form?.email ?? ''} class={field} />
      </label>
      <label class="flex flex-col gap-1 text-sm font-medium">
        Пароль <input name="password" type="password" autocomplete="current-password" required class={field} />
      </label>
      <button class="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400">
        Увійти
      </button>
    </form>
  </main>