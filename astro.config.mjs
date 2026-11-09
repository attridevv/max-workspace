import { defineConfig } from 'astro/config';

// GitHub Pages serves this repo at https://attridevv.github.io/max-workspace/
// If a custom domain ever points at the site root, set base to '/'.
export default defineConfig({
  base: '/max-workspace',
  build: {
    assets: '_assets',
  },
});
