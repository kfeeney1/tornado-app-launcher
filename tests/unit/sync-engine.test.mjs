import test from 'node:test'
import assert from 'node:assert/strict'
import { createDefaultPortableConfig } from '../../src/config/localConfig.js'
import { loadAccountPortable, saveAccountPortable } from '../../src/sync/accountCache.js'
import { applyDomain, reconcileInitial, sameDomain, toDomain } from '../../src/sync/syncLogic.js'

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed))
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    snapshot: () => Object.fromEntries(values),
  }
}

test('missing cloud domains seed from local portable configuration', () => {
  const local = createDefaultPortableConfig()
  local.appearance.theme = 'light'
  local.launcher.selectedItemIds = ['spotify', 'roblox']
  const result = reconcileInitial(local, {
    appearance: { status: 'missing', data: null },
    launcher: { status: 'missing', data: null },
    preferences: { status: 'missing', data: null },
  })
  assert.deepEqual(result.portable, local)
  assert.deepEqual(result.seed, ['appearance', 'launcher', 'preferences'])
  assert.deepEqual(result.blocked, [])
})

test('established cloud domains replace fresh local values independently', () => {
  const local = createDefaultPortableConfig()
  const result = reconcileInitial(local, {
    appearance: { status: 'ready', data: { schemaVersion: 1, theme: 'light' } },
    launcher: { status: 'ready', data: { schemaVersion: 1, selectedItemIds: ['roblox', 'spotify'] } },
    preferences: { status: 'missing', data: null },
  })
  assert.equal(result.portable.appearance.theme, 'light')
  assert.deepEqual(result.portable.launcher.selectedItemIds, ['roblox', 'spotify'])
  assert.deepEqual(result.seed, ['preferences'])
})

test('malformed cloud domain is blocked without destroying valid domains', () => {
  const local = createDefaultPortableConfig()
  const result = reconcileInitial(local, {
    appearance: { status: 'malformed', data: null },
    launcher: { status: 'ready', data: { schemaVersion: 1, selectedItemIds: ['minecraft'] } },
    preferences: { status: 'ready', data: { schemaVersion: 1 } },
  })
  assert.equal(result.portable.appearance.theme, local.appearance.theme)
  assert.deepEqual(result.portable.launcher.selectedItemIds, ['minecraft'])
  assert.deepEqual(result.blocked, ['appearance'])
})

test('domain comparison prevents redundant cloud writes', () => {
  const portable = createDefaultPortableConfig()
  assert.equal(sameDomain(portable, 'appearance', toDomain(portable, 'appearance')), true)
  assert.equal(sameDomain(portable, 'launcher', { schemaVersion: 1, selectedItemIds: ['roblox'] }), false)
})

test('remote domain application does not touch unrelated settings', () => {
  const portable = createDefaultPortableConfig()
  const next = applyDomain(portable, 'appearance', { schemaVersion: 1, theme: 'light' })
  assert.equal(next.appearance.theme, 'light')
  assert.deepEqual(next.launcher, portable.launcher)
})

test('account caches isolate users and legacy config is claimed only once', () => {
  const legacy = createDefaultPortableConfig()
  legacy.appearance.theme = 'light'
  const store = memoryStorage({ 'tornado-portable-config-v1': JSON.stringify(legacy) })
  const a = loadAccountPortable('user-a', store)
  assert.equal(a.appearance.theme, 'light')
  const b = loadAccountPortable('user-b', store)
  assert.equal(b.appearance.theme, 'dark')
  const changed = { ...b, launcher: { selectedItemIds: ['roblox'] } }
  assert.equal(saveAccountPortable('user-b', changed, store), true)
  assert.deepEqual(loadAccountPortable('user-b', store).launcher.selectedItemIds, ['roblox'])
  assert.notDeepEqual(loadAccountPortable('user-a', store).launcher.selectedItemIds, ['roblox'])
})
