import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Build ChatInterface as a self-contained UMD bundle that can be loaded in
// Electron's renderer (Lit/Vanilla environment).
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/registerChatInterface.tsx'),
      name: 'ChatInterface',
      fileName: (format) => `chat-interface.${format}.js`,
      formats: ['umd'], // bundle React inside
    },
    outDir: '../apps/app/dist/widget', // path relative to frontend
    emptyOutDir: false, // Don't empty the directory since other widgets are there
    rollupOptions: {
      // Bundle everything (including React) so we don't rely on globals
      external: [],
    },
  },
});
