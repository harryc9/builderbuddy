import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './lib'),
    },
  },
  test: {
    globals: true,
    include: ['**/*.core.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    testTimeout: 120_000,
  },
})
