import test from 'node:test'
import assert from 'node:assert/strict'
import { getPlatform, isAndroid, isDesktop, isWeb, openExternal } from '../src/platform/index.js'

test('defaults to web outside native shells', async () => {
  global.window = { open: () => ({}) }
  assert.equal(getPlatform(), 'web')
  assert.equal(isWeb(), true)
  assert.equal(isDesktop(), false)
  assert.equal(isAndroid(), false)
  assert.equal(await openExternal('https://example.com'), true)
})

test('detects the restricted Electron bridge as Windows', async () => {
  let opened = null
  global.window = {
    tornadoPlatform: {
      getPlatform: () => 'windows',
      openExternal: async url => { opened = url; return true },
    },
  }
  assert.equal(getPlatform(), 'windows')
  assert.equal(isDesktop(), true)
  assert.equal(await openExternal('https://example.com/path'), true)
  assert.equal(opened, 'https://example.com/path')
})

test('recognises a Capacitor Android runtime without Electron', () => {
  global.window = { Capacitor: { getPlatform: () => 'android' } }
  assert.equal(getPlatform(), 'android')
  assert.equal(isAndroid(), true)
  assert.equal(isDesktop(), false)
})
