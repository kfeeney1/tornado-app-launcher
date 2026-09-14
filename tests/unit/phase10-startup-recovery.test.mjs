import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEVICE_CONFIG_BACKUP_KEY,
  PORTABLE_CONFIG_BACKUP_KEY,
  runStartupConfigRecovery,
} from '../../src/config/startupRecovery.js'
import {
  DEVICE_CONFIG_STORAGE_KEY,
  PORTABLE_CONFIG_STORAGE_KEY,
  createDefaultDeviceConfig,
  createDefaultPortableConfig,
} from '../../src/config/localConfig.js'

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed))
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) },
  }
}

const json = value => JSON.stringify(value)

test('healthy configs become bounded last-known-good backups', () => {
  const portable = createDefaultPortableConfig()
  const device = createDefaultDeviceConfig('windows')
  const storage = memoryStorage({
    [PORTABLE_CONFIG_STORAGE_KEY]: json(portable),
    [DEVICE_CONFIG_STORAGE_KEY]: json(device),
  })

  const result = runStartupConfigRecovery(storage)

  assert.deepEqual(result, { portable: 'healthy', device: 'healthy' })
  assert.deepEqual(JSON.parse(storage.getItem(PORTABLE_CONFIG_BACKUP_KEY)), portable)
  assert.deepEqual(JSON.parse(storage.getItem(DEVICE_CONFIG_BACKUP_KEY)), device)
})

test('malformed current config restores the previous validated copy', () => {
  const portable = createDefaultPortableConfig()
  const device = createDefaultDeviceConfig('windows')
  const storage = memoryStorage({
    [PORTABLE_CONFIG_STORAGE_KEY]: '{not-json',
    [DEVICE_CONFIG_STORAGE_KEY]: '{broken',
    [PORTABLE_CONFIG_BACKUP_KEY]: json(portable),
    [DEVICE_CONFIG_BACKUP_KEY]: json(device),
  })

  const result = runStartupConfigRecovery(storage)

  assert.deepEqual(result, {
    portable: 'restored-last-known-good',
    device: 'restored-last-known-good',
  })
  assert.deepEqual(JSON.parse(storage.getItem(PORTABLE_CONFIG_STORAGE_KEY)), portable)
  assert.deepEqual(JSON.parse(storage.getItem(DEVICE_CONFIG_STORAGE_KEY)), device)
})

test('unsupported newer schema is preserved and never replaced from backup', () => {
  const futurePortable = { schemaVersion: 99, future: true }
  const storage = memoryStorage({
    [PORTABLE_CONFIG_STORAGE_KEY]: json(futurePortable),
    [PORTABLE_CONFIG_BACKUP_KEY]: json(createDefaultPortableConfig()),
  })

  const result = runStartupConfigRecovery(storage)

  assert.equal(result.portable, 'future-schema-preserved')
  assert.deepEqual(JSON.parse(storage.getItem(PORTABLE_CONFIG_STORAGE_KEY)), futurePortable)
})

test('corrupt config without a valid backup remains diagnosable for normal migration fallback', () => {
  const storage = memoryStorage({
    [PORTABLE_CONFIG_STORAGE_KEY]: '{broken',
    [DEVICE_CONFIG_STORAGE_KEY]: json({ schemaVersion: 2, platform: 'windows' }),
  })

  const result = runStartupConfigRecovery(storage)

  assert.deepEqual(result, {
    portable: 'corrupt-no-backup',
    device: 'invalid-no-backup',
  })
})
