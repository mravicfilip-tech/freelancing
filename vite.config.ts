import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Two documents: the landing hero and the Education Centre glossary (/glossary).
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        glossary: fileURLToPath(new URL('./glossary/index.html', import.meta.url)),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three';
          if (id.includes('node_modules/gsap/')) return 'gsap';
          return undefined;
        },
      },
    },
  },
});
