export const prerender = false;
import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { getSettings } from '../lib/settings';

// Serve il PDF del menù: quello caricato dal gestore se presente,
// altrimenti reindirizza a quello di default incluso nella build.
export const GET: APIRoute = async ({ redirect }) => {
  const { menuPath } = getSettings();
  if (menuPath) {
    try {
      const buf = await readFile(menuPath);
      return new Response(buf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="menu-artigiani.pdf"',
          'Cache-Control': 'public, max-age=300',
        },
      });
    } catch {
      // file mancante → fallback al default
    }
  }
  return redirect('/menu-artigiani.pdf', 302);
};
