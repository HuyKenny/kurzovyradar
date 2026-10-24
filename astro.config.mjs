// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// Pages render on demand from the D1 snapshots (src/worker.ts caches them at the edge);
// guides, reviews, methodology and legal pages are prerendered.
// KR_DEMO=1 builds the local demo (wrangler.demo.jsonc, its own database, own output dir); production never uses it.
const demo = process.env.KR_DEMO === '1';

export default defineConfig({
  site: 'https://kurzovyradar.cz',
  outDir: demo ? './dist-demo' : './dist',
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough', ...(demo ? { configPath: 'wrangler.demo.jsonc' } : {}) }),
  session: false,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: true,
  // GET forms only; nothing posts to the site.
  security: { checkOrigin: false },
  vite: {
    plugins: [tailwindcss()],
    // Every client script as an external file, so the CSP needs no 'unsafe-inline' for scripts.
    build: { assetsInlineLimit: 0 },
    define: { __BUILD_ID__: JSON.stringify(process.env.KR_BUILD ?? String(Date.now())) },
  },
});
