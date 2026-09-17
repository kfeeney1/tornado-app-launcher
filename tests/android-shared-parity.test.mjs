import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('Android receives the shared account, profile, sync and launcher UI', async () => {
  const app = await read('src/App.jsx')
  for (const sharedFeature of ['AccountPanel', 'useAuth', 'useCloudProfile', 'useSync', 'setAppearance', 'setLauncher']) {
    assert.match(app, new RegExp(sharedFeature))
  }
  assert.doesNotMatch(app, /isAndroid\(\).*AccountPanel/)
})

test('Android external navigation uses the official Capacitor Browser plugin', async () => {
  const adapter = await read('src/platform/adapters/android.js')
  assert.match(adapter, /from '@capacitor\/browser'/)
  assert.doesNotMatch(adapter, /window\?\.open|Plugins\?\.Browser/)
})
