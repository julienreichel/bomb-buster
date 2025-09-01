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
  },
})
