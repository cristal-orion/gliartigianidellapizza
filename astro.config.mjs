import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://gliartigiani.it',
  // Le pagine vetrina restano statiche; solo /prenota, /admin e le API
  // girano lato server (vedi `export const prerender = false` nelle pagine).
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [sitemap()],
});
