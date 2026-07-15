// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Load .env.test if present (credentials for authenticated tests)
const envFile = path.join(__dirname, '.env.test');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length && !process.env[k.trim()]) {
      process.env[k.trim()] = v.join('=').trim();
    }
  });
}

const BASE_URL = process.env.BASE_URL || 'https://agendatop.vercel.app';

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
