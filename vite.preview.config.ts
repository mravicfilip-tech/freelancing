import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standalone dashboard preview: one file, everything inlined, no code splitting.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-preview',
    cssCodeSplit: false,
    rollupOptions: {
      input: 'preview.html',
      output: { inlineDynamicImports: true },
    },
  },
});
