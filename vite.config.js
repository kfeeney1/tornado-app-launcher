import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'))

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    'globalThis.__TORNADO_APP_VERSION__': JSON.stringify(packageJson.version),
  },
})
