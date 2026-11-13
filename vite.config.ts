import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import catalog from './src/data/catalog.generated.json';
import { catalogTotalsHtml } from './scripts/html-totals.mjs';

export default defineConfig({
  base: './',
  plugins: [react(), catalogTotalsHtml(catalog.totals)],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
