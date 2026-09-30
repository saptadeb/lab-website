import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Deploy target is driven by env so the same build works for the GitHub Pages
// preview URL and, later, the custom domain. See .github/workflows/deploy.yml.
const SITE_URL = process.env.SITE_URL ?? 'https://saptadeb.github.io';
const BASE_PATH = process.env.BASE_PATH ?? '/lab-website';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: true },
  },
});
