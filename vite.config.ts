import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/// <reference types="vitest" />

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.test.*', 'src/**/__tests__/**', 'src/vite-env.d.ts'],
    },
  },
});
