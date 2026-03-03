import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { cpSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import manifest from './manifest.json';

// CRXJS precisa de referências .ts no manifest para resolver os fontes corretamente.
// O manifest.json original mantém .js para compatibilidade com o build via tsc.
const devManifest = {
  ...manifest,
  // CSP para permitir que o service worker importe scripts do Vite dev server (localhost)
  content_security_policy: {
    extension_pages: "script-src 'self' http://localhost:5173; object-src 'self'"
  },
  background: {
    ...manifest.background,
    service_worker: 'background.ts'
  },
  content_scripts: manifest.content_scripts.map(cs => ({
    ...cs,
    js: cs.js.map((f: string) => f.replace(/\.js$/, '.ts'))
  })),
  web_accessible_resources: manifest.web_accessible_resources.map(war => ({
    ...war,
    resources: war.resources.map((r: string) => {
      if (r.endsWith('.js') && !r.includes('*')) {
        return r.replace(/\.js$/, '.ts');
      }
      return r;
    })
  }))
};

/**
 * Plugin para copiar assets estáticos para dist/ no dev mode.
 * O CRXJS gera um dist/ mínimo no dev e não copia CSS dos content scripts.
 * O Chrome precisa que esses arquivos existam no diretório da extensão.
 */
function copyStaticAssetsDev(): import('vite').Plugin {
  return {
    name: 'ghostgram:copy-static-dev',
    apply: 'serve',
    configureServer() {
      const root = resolve(__dirname);
      const dist = resolve(__dirname, 'dist');
      if (!existsSync(dist)) {
        mkdirSync(dist, { recursive: true });
      }
      const staticFiles = ['styles.css', 'popup.css'];
      for (const file of staticFiles) {
        const src = resolve(root, file);
        if (existsSync(src)) {
          cpSync(src, resolve(dist, file));
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [
    crx({ manifest: devManifest as typeof manifest }),
    copyStaticAssetsDev(),
    viteStaticCopy({
      targets: [
        { src: 'icons/*', dest: 'icons' },
        { src: '*.html', dest: '.' },
        { src: '*.css', dest: '.' }
      ]
    })
  ],
  server: {
    port: 5173,
    strictPort: true,
    cors: true
  },
  build: {
    outDir: 'dist'
  }
});
