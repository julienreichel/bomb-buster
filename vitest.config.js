import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: 'playwright',
      // https://vitest.dev/guide/browser/playwright
      instances: [{ browser: 'chromium' }],
      // CI-friendly configuration
      screenshotFailures: false,
    },
    // Retry tests in CI environments
    retry: process.env.CI ? 2 : 0,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '.quasar/**',
        '*.config.js',
        '*.config.ts',
        'src/App.vue',
        'eslint.config.js',
        'postcss.config.js',
        'quasar.config.js',
        'vitest.config.js',
        'jsconfig.json',
        'public/**',
        'tests/**',
        'src/router/**',
        'src/pages/**',
        'src/layouts/**',
        'scripts/**',
      ],
      // Enforce 80% coverage threshold
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
        // Higher thresholds for critical game logic
        'src/composables/models/**': {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
        'src/composables/managers/**': {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
      },
    },
  },
})
