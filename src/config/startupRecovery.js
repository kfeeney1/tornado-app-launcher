import {
  DEVICE_CONFIG_SCHEMA_VERSION,
  DEVICE_CONFIG_STORAGE_KEY,
  PORTABLE_CONFIG_SCHEMA_VERSION,
  PORTABLE_CONFIG_STORAGE_KEY,
  validateDeviceConfig,
  validatePortableConfig,
} from './localConfig.js'

export const PORTABLE_CONFIG_BACKUP_KEY = 'tornado-portable-config-lkg-v1'
export const DEVICE_CONFIG_BACKUP_KEY = 'tornado-device-config-lkg-v1'

let lastRecovery = Object.freeze({ portable: 'not-run', device: 'not-run' })

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

function browserStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function safeRead(storage, key) {
  try {
    const raw = storage?.getItem(key)
    if (raw == null) return { state: 'missing', value: null }
    return { state: 'parsed', value: JSON.parse(raw) }
  } catch {
    return { state: 'malformed-json', value: null }
  }
}

function safeWrite(storage, key, value) {
  try {
    storage?.setItem(key, JSON.stringify(value))
    return Boolean(storage)
  } catch {
    return false
  }
}

function isFutureSchema(value, currentVersion) {
  return isObject(value) && Number.isInteger(value.schemaVersion) && value.schemaVersion > currentVersion
}

function recoverOne({ storage, currentKey, backupKey, validate, currentVersion }) {
  const current = safeRead(storage, currentKey)
  if (current.state === 'missing') return 'missing'

  if (current.state === 'parsed' && isFutureSchema(current.value, currentVersion)) return 'future-schema-preserved'

  const validCurrent = current.state === 'parsed' ? validate(current.value) : null
  if (validCurrent) {
    safeWrite(storage, backupKey, validCurrent)
    return 'healthy'
  }

  const backup = safeRead(storage, backupKey)
  const validBackup = backup.state === 'parsed' ? validate(backup.value) : null
  if (!validBackup) return current.state === 'malformed-json' ? 'corrupt-no-backup' : 'invalid-no-backup'

  if (!safeWrite(storage, currentKey, validBackup)) return 'recovery-write-failed'
  return 'restored-last-known-good'
}

export function runStartupConfigRecovery(storage = browserStorage()) {
  const result = Object.freeze({
    portable: recoverOne({
      storage,
      currentKey: PORTABLE_CONFIG_STORAGE_KEY,
      backupKey: PORTABLE_CONFIG_BACKUP_KEY,
      validate: validatePortableConfig,
      currentVersion: PORTABLE_CONFIG_SCHEMA_VERSION,
    }),
    device: recoverOne({
      storage,
      currentKey: DEVICE_CONFIG_STORAGE_KEY,
      backupKey: DEVICE_CONFIG_BACKUP_KEY,
      validate: validateDeviceConfig,
      currentVersion: DEVICE_CONFIG_SCHEMA_VERSION,
    }),
  })
  lastRecovery = result
  return result
}

export function getStartupRecoverySummary() {
  return lastRecovery
}
