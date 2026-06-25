import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Chuyển các request /api sang server backend
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
