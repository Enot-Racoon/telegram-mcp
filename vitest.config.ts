import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: ['src/**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@telegram': path.resolve(__dirname, './src/telegram'),
      '@accounts': path.resolve(__dirname, './src/accounts'),
      '@tools': path.resolve(__dirname, './src/tools'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
});
