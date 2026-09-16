import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readJson = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))

test('Capacitor config defines Tornado Android shell over shared dist output', async () => {
  const config = await readJson('capacitor.config.json')
  assert.equal(config.appId, 'ie.tornado.launcher')
  assert.equal(config.appName, 'Tornado')
  assert.equal(config.webDir, 'dist')
})

test('package exposes reproducible Android build commands with pinned Capacitor tooling', async () => {
  const pkg = await readJson('package.json')
  assert.equal(pkg.dependencies['@capacitor/core'], '7.4.3')
  assert.equal(pkg.dependencies['@capacitor/android'], '7.4.3')
  assert.equal(pkg.devDependencies['@capacitor/cli'], '7.4.3')
  assert.match(pkg.scripts['android:build:debug'], /assembleDebug/)
})
