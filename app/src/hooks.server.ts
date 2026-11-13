import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';

const ALLOWED_ORIGINS = new Set(dev ? ['http://localhost:5174'] : []);

const PREFLIGHT_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '600'
};

export const handle: Handle = async ({ event, resolve }) => {
  const origin = event.request.headers.get('origin');
  const isApi = event.url.pathname.startsWith('/api/');
  const corsAllowed = isApi && origin !== null && ALLOWED_ORIGINS.has(origin);

  if (corsAllowed && event.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...PREFLIGHT_HEADERS, 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
    });
  }

  const response = await resolve(event);
  if (corsAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Expose-Headers', 'Location');
    response.headers.append('Vary', 'Origin');
  }
  return response;
};