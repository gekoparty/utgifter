import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy is moved from package.json to the Vite config
export default defineConfig({
  plugins: [react()],
  server: {
    // Your old proxy setting
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  build: {
    outDir: 'dist', // Default Vite output directory
  },
});