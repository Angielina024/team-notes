<script lang="ts">
    import type { LayoutProps } from './$types';
  
    let { data, children }: LayoutProps = $props();
  </script>
  
  <header class="border-b border-neutral-200 dark:border-neutral-800">
    <nav class="mx-auto flex max-w-4xl items-center justify-between p-4" aria-label="Головна">
      <a href="/notes" class="font-semibold">Team Notes</a>
      <div class="flex items-center gap-3 text-sm">
        <span>{data.user.name}</span>
        <form method="POST" action="/login?/logout">
          <button class="underline hover:no-underline">Вийти</button>
        </form>
      </div>
    </nav>
  </header>
  
  <main class="mx-auto max-w-4xl p-4 text-neutral-900 dark:text-neutral-100">
    {@render children()}
  </main>