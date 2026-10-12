import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  test: {
    root: path.resolve(__dirname),
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
