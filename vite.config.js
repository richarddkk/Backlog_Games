import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, strictPort: true, host: '0.0.0.0' },
  test: { environment: 'jsdom', setupFiles: './tests/setup.js', globals: true, exclude: ['tests/firestore.rules.test.js', 'node_modules/**', 'dist/**', 'share-service/**'] },
});
