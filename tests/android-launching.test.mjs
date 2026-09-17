import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const adapter = await readFile(new URL('../src/platform/adapters/android.js', import.meta.url), 'utf8')
const service = await readFile(new URL('../src/platform/launchService.js', import.meta.url), 'utf8')
const resolver = await readFile(new URL('../src/platform/launchResolver.js', import.meta.url), 'utf8')

test('Android exposes native launch through the official App Launcher plugin', () => {
  assert.match(adapter, /@capacitor\/app-launcher/)
  assert.match(adapter, /NATIVE_APP_LAUNCH/)
  assert.match(adapter, /canOpenUrl/)
  assert.match(adapter, /openUrl/)
})

test('failed native game launch falls back to the Android Play Store URL', () => {
  assert.match(service, /return openFallback\(target, platformApi\)/)
  assert.match(resolver, /platformKind === 'android' && item\.playStoreUrl/)
})
