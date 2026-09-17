import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../src/platform/AndroidLifecycleBoundary.jsx', import.meta.url), 'utf8')

test('Android hardware back returns from child views before exiting', () => {
  assert.match(source, /backButton/)
  assert.match(source, /tornadoView !== 'home'/)
  assert.match(source, /window\.history\.back\(\)/)
})

test('Android root back requires confirmation before native exit', () => {
  assert.match(source, /window\.confirm\('Exit Tornado\?'\)/)
  assert.match(source, /CapacitorApp\.exitApp\(\)/)
})

test('Android lifecycle publishes a resume event', () => {
  assert.match(source, /appStateChange/)
  assert.match(source, /tornado-app-resumed/)
})
