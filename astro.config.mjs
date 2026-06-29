import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://gliartigiani.it',
  // Le pagine vetrina restano statiche; solo /prenota, /admin e le API
  // girano lato server (vedi `export const prerender = false` nelle pagine).
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    // Escludi le pagine private/gestionali dalla sitemap (restano comunque noindex)
    sitemap({ filter: (page) => !page.includes('/admin') }),
  ],
  // Dietro il reverse proxy (Traefik/Coolify) il TLS è terminato dal proxy,
  // quindi l'app si percepisce come http e il controllo Origin di Astro
  // rigetterebbe i POST con Origin https del browser. La protezione CSRF
  // resta garantita dal cookie di sessione SameSite=Lax.
  security: { checkOrigin: false },
});
