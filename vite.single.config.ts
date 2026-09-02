import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// One-file build used by scripts/build-single.mjs (everything inlined, no code splitting).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-single',
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
