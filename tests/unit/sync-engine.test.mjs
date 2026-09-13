import test from 'node:test'
import assert from 'node:assert/strict'
import { createDefaultPortableConfig } from '../../src/config/localConfig.js'
import { accountCacheMetaKey, loadAccountPortable, loadAccountPortableState, markAccountReconciled, saveAccountPortable } from '../../src/sync/accountCache.js'
import { applyDomain, reconcileInitial, sameDomain, toDomain } from '../../src/sync/syncLogic.js'
import { MIGRATION_STATE, comparePortableConfigs, determineInitialReconciliation, isFreshDefaultPortable, normalizePortableConfig } from '../../src/sync/reconciliation.js'

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed))
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    snapshot: () => Object.fromEntries(values),
  }
}

const cloud = portable => ({
  appearance: { status: 'ready', data: toDomain(portable, 'appearance') },
  launcher: { status: 'ready', data: toDomain(portable, 'launcher') },
  preferences: { status: 'ready', data: toDomain(portable, 'preferences') },
})
const missingCloud = () => ({
  appearance: { status: 'missing', data: null },
  launcher: { status: 'missing', data: null },
  preferences: { status: 'missing', data: null },
})

test('missing cloud domains seed from local portable configuration', () => {
  const local = createDefaultPortableConfig()
  local.appearance.theme = 'light'
  local.launcher.selectedItemIds = ['spotify', 'roblox']
  const result = reconcileInitial(local, missingCloud())
  assert.deepEqual(result.portable, local)
  assert.deepEqual(result.seed, ['appearance', 'launcher', 'preferences'])
  assert.deepEqual(result.blocked, [])
})

test('normalization preserves meaningful launcher ordering but drops storage metadata by validation', () => {
  const first = createDefaultPortableConfig()
  first.launcher.selectedItemIds = ['spotify', 'roblox']
  const second = { ...first, launcher: { selectedItemIds: ['roblox', 'spotify'] }, updatedAt: 'ignored' }
  assert.deepEqual(normalizePortableConfig(first), first)
  const comparison = comparePortableConfigs(first, second)
  assert.equal(comparison.equivalent, false)
  assert.equal(comparison.differences.appsAndGames, true)
})

test('fresh/default detection is explicit', () => {
  assert.equal(isFreshDefaultPortable(createDefaultPortableConfig()), true)
  const empty = createDefaultPortableConfig()
  empty.launcher.selectedItemIds = []
  assert.equal(isFreshDefaultPortable(empty), false)
})

test('scenario A: meaningful local-only setup initializes cloud without conflict', () => {
  const local = createDefaultPortableConfig()
  local.appearance.theme = 'light'
  local.launcher.selectedItemIds = ['spotify', 'roblox']
  const result = determineInitialReconciliation({ portable: local, source: 'legacy', reconciled: false }, missingCloud())
  assert.equal(result.state, MIGRATION_STATE.LOCAL_ONLY)
  assert.deepEqual(result.seed, ['appearance', 'launcher', 'preferences'])
  assert.deepEqual(result.portable, local)
})

test('scenario B: fresh local install loads established cloud automatically', () => {
  const local = createDefaultPortableConfig()
  const remote = createDefaultPortableConfig()
  remote.appearance.theme = 'light'
  remote.launcher.selectedItemIds = ['roblox', 'spotify']
  const result = determineInitialReconciliation({ portable: local, source: 'fresh', reconciled: false }, cloud(remote))
  assert.equal(result.state, MIGRATION_STATE.CLOUD_ONLY)
  assert.deepEqual(result.portable, remote)
})

test('scenario C: equivalent local and cloud do not prompt', () => {
  const local = createDefaultPortableConfig()
  local.launcher.selectedItemIds = ['spotify', 'minecraft']
  const result = determineInitialReconciliation({ portable: local, source: 'legacy', reconciled: false }, cloud(local))
  assert.equal(result.state, MIGRATION_STATE.EQUIVALENT)
})

test('scenario D/E: meaningful differences become a structured conflict before sync', () => {
  const local = createDefaultPortableConfig()
  local.launcher.selectedItemIds = ['spotify', 'discord', 'chrome', 'minecraft']
  const remote = createDefaultPortableConfig()
  remote.launcher.selectedItemIds = ['spotify', 'discord', 'youtube', 'minecraft', 'roblox']
  remote.appearance.theme = 'light'
  const result = determineInitialReconciliation({ portable: local, source: 'legacy', reconciled: false }, cloud(remote))
  assert.equal(result.state, MIGRATION_STATE.CONFLICT)
  assert.equal(result.differences.appsAndGames, true)
  assert.equal(result.differences.appearance, true)
  assert.deepEqual(result.portable, local)
  assert.deepEqual(result.cloudPortable, remote)
})

test('partial cloud configuration compares established domains and seeds missing domains', () => {
  const local = createDefaultPortableConfig()
  local.launcher.selectedItemIds = ['spotify', 'roblox']
  const result = determineInitialReconciliation({ portable: local, source: 'legacy', reconciled: false }, {
    appearance: { status: 'ready', data: toDomain(local, 'appearance') },
    launcher: { status: 'ready', data: toDomain(local, 'launcher') },
    preferences: { status: 'missing', data: null },
  })
  assert.equal(result.state, MIGRATION_STATE.EQUIVALENT)
  assert.deepEqual(result.seed, ['preferences'])
})

test('malformed cloud is blocked instead of being interpreted as missing', () => {
  const local = createDefaultPortableConfig()
  const result = determineInitialReconciliation({ portable: local, source: 'legacy', reconciled: false }, {
    ...missingCloud(), launcher: { status: 'malformed', data: null },
  })
  assert.equal(result.state, MIGRATION_STATE.ERROR)
  assert.equal(result.reason, 'invalid-cloud')
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

test('legacy local configuration is claimed by the first account and migration state is account-aware', () => {
  const legacy = createDefaultPortableConfig()
  legacy.appearance.theme = 'light'
  const store = memoryStorage({ 'tornado-portable-config-v1': JSON.stringify(legacy) })
  const a = loadAccountPortableState('user-a', store)
  assert.equal(a.source, 'legacy')
  assert.equal(a.portable.appearance.theme, 'light')
  markAccountReconciled('user-a', store)
  assert.equal(loadAccountPortableState('user-a', store).reconciled, true)
  assert.match(store.getItem(accountCacheMetaKey('user-a')), /"ownerUid":"user-a"/)
})

test('scenario F: a second account never inherits or uploads the first account cache', () => {
  const legacy = createDefaultPortableConfig()
  legacy.appearance.theme = 'light'
  const store = memoryStorage({ 'tornado-portable-config-v1': JSON.stringify(legacy) })
  const first = loadAccountPortableState('user-a', store)
  assert.equal(first.portable.appearance.theme, 'light')
  const second = loadAccountPortableState('user-b', store)
  assert.equal(second.source, 'fresh')
  assert.deepEqual(second.portable, createDefaultPortableConfig())
  const changed = { ...second.portable, launcher: { selectedItemIds: ['roblox'] } }
  assert.equal(saveAccountPortable('user-b', changed, store), true)
  assert.deepEqual(loadAccountPortable('user-b', store).launcher.selectedItemIds, ['roblox'])
  assert.notDeepEqual(loadAccountPortable('user-a', store).launcher.selectedItemIds, ['roblox'])
})

test('existing Stage 4 account cache without Stage 5 metadata is conservatively account-owned and unreconciled', () => {
  const cached = createDefaultPortableConfig()
  cached.launcher.selectedItemIds = ['minecraft']
  const store = memoryStorage({ 'tornado-account-portable-v1:user-a': JSON.stringify(cached) })
  const state = loadAccountPortableState('user-a', store)
  assert.equal(state.source, 'account')
  assert.equal(state.reconciled, false)
  assert.deepEqual(state.portable.launcher.selectedItemIds, ['minecraft'])
})
