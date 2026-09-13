import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: {
    command: 'npm run build && npx vite preview --host 127.0.0.1',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    env: { ...process.env, VITE_AUTH_TEST_MODE: 'true' },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
