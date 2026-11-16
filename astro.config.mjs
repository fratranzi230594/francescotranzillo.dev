// @ts-check
import { defineConfig } from 'astro/config';

// SITE_URL is set by the deploy pipeline (custom domain or the CloudFront URL).
export default defineConfig({
  site: process.env.SITE_URL || 'https://francescotranzillo.dev',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  vite: { build: { chunkSizeWarningLimit: 800 } },
  i18n: {
    locales: ['en', 'it', 'de'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
});
