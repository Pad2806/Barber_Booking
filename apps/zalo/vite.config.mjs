import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import zaloMiniApp from 'zmp-vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), zaloMiniApp()],
  root: '.',
  base: '/',
  server: {
    port: 3005,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
});
