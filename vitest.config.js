import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

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
      ],
    },
  },
})
