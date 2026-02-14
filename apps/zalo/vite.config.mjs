import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import zaloMiniApp from 'zmp-vite-plugin';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Read and clean the source app-config.json for zmp-vite-plugin
// This prevents asset list duplication across builds
const appConfigPath = resolve('app-config.json');
const sourceConfig = existsSync(appConfigPath)
  ? JSON.parse(readFileSync(appConfigPath, 'utf-8'))
  : { app: { title: 'ReetroBarberShop' } };

// Clean config: keep pages/template/framework, clear asset lists to prevent duplication
const cleanConfig = {
  template: sourceConfig.template,
  framework: sourceConfig.framework,
  app: sourceConfig.app,
  pages: sourceConfig.pages || [],
  listCSS: [],
  listSyncJS: [],
  listAsyncJS: [],
};

// zmp-vite-plugin v1.1.6 hardcodes `pages: []` in output.
// This post-build plugin patches the built app-config.json to restore pages.
function injectPages() {
  return {
    name: 'inject-pages-post-build',
    closeBundle() {
      const outDir = resolve('www');
      const builtConfigPath = resolve(outDir, 'app-config.json');
      if (existsSync(builtConfigPath)) {
        const builtConfig = JSON.parse(readFileSync(builtConfigPath, 'utf-8'));
        builtConfig.pages = sourceConfig.pages || [];
        writeFileSync(builtConfigPath, JSON.stringify(builtConfig));
        console.log(`\n✅ Injected ${builtConfig.pages.length} pages into www/app-config.json`);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    zaloMiniApp(cleanConfig),
    injectPages(),
  ],
  root: '.',
  base: './',
  server: {
    port: 3005,
    strictPort: true,
  },
  build: {
    outDir: 'www',
  },
});
