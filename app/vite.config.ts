import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { loadEnv } from 'vite';

const testEnv = loadEnv('test', process.cwd(), '');

export default defineConfig({
	server: {
		cors: { origin: false }
	  },
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	],
	test: {
		projects: [
		  {
			extends: './vite.config.ts',
			test: { name: 'unit', environment: 'node', include: ['tests/unit/**/*.test.ts'] },
		  },
		  {
			extends: './vite.config.ts',
			test: {
			  name: 'integration',
			  environment: 'node',
			  include: ['tests/integration/**/*.test.ts'],
			  env: testEnv,
			  hookTimeout: 30_000,
			},
		  },
		],
	  },
	});