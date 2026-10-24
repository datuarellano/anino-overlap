import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base works under any GitHub Pages repo path, since routing is hash-based.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: { firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'] },
      },
    },
  },
});
