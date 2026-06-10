export const prerender = false;
import type { APIRoute } from 'astro';
import { getSettings, getClosures } from '../../../lib/settings';

export const GET: APIRoute = async () => {
  const { hours, slots } = getSettings();
  const closures = getClosures().map((c) => ({ date: c.date, reason: c.reason }));
  return new Response(JSON.stringify({ hours, slots, closures }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
};
