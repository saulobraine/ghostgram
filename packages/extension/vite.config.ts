import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    crx({ manifest }),
    viteStaticCopy({
      targets: [
        { src: 'icons/*', dest: 'icons' },
        { src: '*.html', dest: '.' },
        { src: '*.css', dest: '.' }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: 'background.ts',
        content: 'content.ts',
        'content-main': 'content-main.ts',
        popup: 'popup.ts'
      }
    }
  }
});
