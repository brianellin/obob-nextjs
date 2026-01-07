import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000, // 30 second timeout per test
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/api-battle-questions.test.ts', // Exclude slow API tests from default runs
      '**/tests/question-selection.test.ts', // Exclude slow question selection tests from default runs
      '**/tests/daily-crossword-generation.test.ts', // Exclude slow crossword generation tests from default runs
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
