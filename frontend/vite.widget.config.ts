import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
// Build ChatWidget as a self-contained UMD bundle that can be loaded in
// Electron's renderer (Lit/Vanilla environment).
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/registerChatWidget.tsx'),
      name: 'ChatWidget',
      fileName: (format) => `chat-widget.${format}.js`,
      formats: ['umd'], // bundle React inside
    },
    outDir: '../apps/app/dist/widget', // path relative to frontend
    emptyOutDir: true,
    rollupOptions: {
      // Bundle everything (including React) so we don't rely on globals
      external: [],
    },
  },
}); 