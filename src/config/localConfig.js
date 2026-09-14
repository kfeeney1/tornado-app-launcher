import { defaultSelection } from '../data/catalog.js'
import { isStableTornadoId } from '../cloud/schema.js'

export const PORTABLE_CONFIG_SCHEMA_VERSION = 1
export const DEVICE_CONFIG_SCHEMA_VERSION = 2
export const PORTABLE_CONFIG_STORAGE_KEY = 'tornado-portable-config-v1'
export const DEVICE_CONFIG_STORAGE_KEY = 'tornado-device-config-v1'
const LEGACY_THEME_KEY = 'tornado-theme'
const LEGACY_SELECTION_KEY = 'tornado-selection'
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const validPlatforms = new Set(['web', 'android', 'windows', 'unknown'])
const validResolutionSources = new Set(['discovery', 'game-resolver', 'manual'])
const validLaunchers = new Set(['minecraft-launcher', 'roblox', 'epic-games'])

function browserStorage() {
  try { return globalThis.localStorage ?? null } catch { return null }
}

export function createDefaultPortableConfig() {
  return { schemaVersion: 1, appearance: { theme: 'dark' }, launcher: { selectedItemIds: [...defaultSelection] }, preferences: {} }
}

export function detectPlatform(userAgent = globalThis.navigator?.userAgent ?? '') {
  if (/Android/i.test(userAgent)) return 'android'
  if (/Windows/i.test(userAgent)) return 'windows'
  if (userAgent) return 'web'
  return 'unknown'
}

export function createDefaultDeviceConfig(platform = detectPlatform()) {
  return {
    schemaVersion: DEVICE_CONFIG_SCHEMA_VERSION,
    platform,
    installationId: null,
    launchTargets: {},
    installedApps: {},
    nativePreferences: {},
  }
}

export function validatePortableConfig(value) {
  if (!isObject(value) || value.schemaVersion !== 1) return null
  if (!isObject(value.appearance) || !['dark', 'light'].includes(value.appearance.theme)) return null
  if (!isObject(value.launcher) || !Array.isArray(value.launcher.selectedItemIds)) return null
  if (value.launcher.selectedItemIds.length > 10) return null
  if (!value.launcher.selectedItemIds.every(isStableTornadoId)) return null
  if (new Set(value.launcher.selectedItemIds).size !== value.launcher.selectedItemIds.length) return null
  if (!isObject(value.preferences)) return null
  return { schemaVersion: 1, appearance: { theme: value.appearance.theme }, launcher: { selectedItemIds: [...value.launcher.selectedItemIds] }, preferences: { ...value.preferences } }
}

function sanitizeLaunchTargets(value) {
  if (!isObject(value)) return null
  const result = {}
  for (const [appId, target] of Object.entries(value)) {
    if (!isStableTornadoId(appId) || !isObject(target)) continue
    const sanitized = {}
    if (typeof target.executablePath === 'string' && target.executablePath.length <= 1024) sanitized.executablePath = target.executablePath
    if (validResolutionSources.has(target.source)) sanitized.source = target.source
    if (Number.isFinite(target.updatedAt) && target.updatedAt >= 0) sanitized.updatedAt = target.updatedAt
    if (Object.keys(sanitized).length) result[appId] = sanitized
  }
  return result
}

function sanitizeInstalledApps(value) {
  if (!isObject(value)) return null
  const result = {}
  for (const [appId, state] of Object.entries(value)) {
    if (!isStableTornadoId(appId) || !isObject(state) || typeof state.installed !== 'boolean') continue
    if (!Number.isFinite(state.checkedAt) || state.checkedAt < 0) continue
    const launcher = validLaunchers.has(state.launcher) ? state.launcher : null
    const source = validResolutionSources.has(state.source) ? state.source : 'discovery'
    result[appId] = { installed: state.installed, launcher, source, checkedAt: state.checkedAt }
  }
  return result
}

function sanitizeNativePreferences(value) {
  if (!isObject(value)) return null
  const result = {}
  for (const [key, preference] of Object.entries(value)) {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(key)) continue
    if (['string', 'number', 'boolean'].includes(typeof preference) || preference === null) result[key] = preference
  }
  return result
}

export function validateDeviceConfig(value) {
  if (!isObject(value) || value.schemaVersion !== DEVICE_CONFIG_SCHEMA_VERSION) return null
  if (!validPlatforms.has(value.platform)) return null
  if (value.installationId != null && typeof value.installationId !== 'string') return null
  const launchTargets = sanitizeLaunchTargets(value.launchTargets)
  const installedApps = sanitizeInstalledApps(value.installedApps)
  const nativePreferences = sanitizeNativePreferences(value.nativePreferences)
  if (!launchTargets || !installedApps || !nativePreferences) return null
  return {
    schemaVersion: DEVICE_CONFIG_SCHEMA_VERSION,
    platform: value.platform,
    installationId: value.installationId ?? null,
    launchTargets,
    installedApps,
    nativePreferences,
  }
}

function migrateDeviceConfigV1(value, platform) {
  if (!isObject(value) || value.schemaVersion !== 1) return null
  if (!validPlatforms.has(value.platform)) return null
  if (!isObject(value.launchTargets) || !isObject(value.nativePreferences)) return null
  return validateDeviceConfig({
    schemaVersion: DEVICE_CONFIG_SCHEMA_VERSION,
    platform: value.platform || platform,
    installationId: typeof value.installationId === 'string' ? value.installationId : null,
    launchTargets: value.launchTargets,
    installedApps: {},
    nativePreferences: value.nativePreferences,
  })
}

function parseStoredJson(storage, key) {
  try { const raw = storage?.getItem(key); return raw == null ? null : JSON.parse(raw) } catch { return null }
}

function hasStoredValue(storage, key) {
  try { return storage?.getItem(key) != null } catch { return false }
}

function safeWrite(storage, key, value) {
  try { if (!storage) return false; storage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

const isFutureSchema = (value, current) => isObject(value) && Number.isInteger(value.schemaVersion) && value.schemaVersion > current

export function migrateLegacyLocalConfig(storage = browserStorage(), platform = detectPlatform()) {
  const storedPortable = parseStoredJson(storage, PORTABLE_CONFIG_STORAGE_KEY)
  const storedDevice = parseStoredJson(storage, DEVICE_CONFIG_STORAGE_KEY)
  const currentPortable = validatePortableConfig(storedPortable)
  const currentDevice = validateDeviceConfig(storedDevice)
  const migratedDevice = currentDevice ?? migrateDeviceConfigV1(storedDevice, platform)
  if (currentPortable && currentDevice) return { portable: currentPortable, device: currentDevice, migrated: false, unsupportedFutureSchema: false }

  const portableFuture = isFutureSchema(storedPortable, PORTABLE_CONFIG_SCHEMA_VERSION)
  const deviceFuture = isFutureSchema(storedDevice, DEVICE_CONFIG_SCHEMA_VERSION)
  const defaults = createDefaultPortableConfig()
  const legacyTheme = parseStoredJson(storage, LEGACY_THEME_KEY)
  const legacySelection = parseStoredJson(storage, LEGACY_SELECTION_KEY)
  const portable = currentPortable ?? validatePortableConfig({
    ...defaults,
    appearance: { theme: legacyTheme === 'light' || legacyTheme === 'dark' ? legacyTheme : defaults.appearance.theme },
    launcher: { selectedItemIds: Array.isArray(legacySelection) ? legacySelection.filter(isStableTornadoId).filter((id, index, ids) => ids.indexOf(id) === index).slice(0, 10) : defaults.launcher.selectedItemIds },
  }) ?? defaults
  const device = migratedDevice ?? createDefaultDeviceConfig(platform)

  const portableWritten = currentPortable || portableFuture ? true : safeWrite(storage, PORTABLE_CONFIG_STORAGE_KEY, portable)
  const deviceWritten = currentDevice || deviceFuture ? true : safeWrite(storage, DEVICE_CONFIG_STORAGE_KEY, device)
  if (!portableFuture && !deviceFuture && portableWritten && deviceWritten) {
    try {
      storage?.removeItem(LEGACY_THEME_KEY)
      storage?.removeItem(LEGACY_SELECTION_KEY)
    } catch {
      // Versioned data is already durable; legacy cleanup is best-effort.
    }
  }

  return {
    portable,
    device,
    migrated: !currentPortable || !currentDevice,
    unsupportedFutureSchema: portableFuture || deviceFuture,
  }
}

export function inspectLocalPortableState(storage = browserStorage()) {
  const hadVersionedPortable = hasStoredValue(storage, PORTABLE_CONFIG_STORAGE_KEY)
  const hadLegacyTheme = hasStoredValue(storage, LEGACY_THEME_KEY)
  const hadLegacySelection = hasStoredValue(storage, LEGACY_SELECTION_KEY)
  const migration = migrateLegacyLocalConfig(storage)
  const defaults = createDefaultPortableConfig()
  const equivalentToDefaults = JSON.stringify(validatePortableConfig(migration.portable)) === JSON.stringify(validatePortableConfig(defaults))
  const hadAnyPortableState = hadVersionedPortable || hadLegacyTheme || hadLegacySelection
  return {
    portable: migration.portable,
    source: !hadAnyPortableState || (hadVersionedPortable && !hadLegacyTheme && !hadLegacySelection && equivalentToDefaults) ? 'fresh' : 'legacy',
    unsupportedFutureSchema: migration.unsupportedFutureSchema,
  }
}

export function getPortableConfig(storage = browserStorage()) { return migrateLegacyLocalConfig(storage).portable }
export function getDeviceConfig(storage = browserStorage()) { return migrateLegacyLocalConfig(storage).device }

export function updatePortableConfig(updater, storage = browserStorage()) {
  const migration = migrateLegacyLocalConfig(storage)
  if (migration.unsupportedFutureSchema) return migration.portable
  const current = migration.portable
  const candidate = typeof updater === 'function' ? updater(current) : updater
  const validated = validatePortableConfig(candidate)
  return validated && safeWrite(storage, PORTABLE_CONFIG_STORAGE_KEY, validated) ? validated : current
}

export function updateDeviceConfig(updater, storage = browserStorage()) {
  const migration = migrateLegacyLocalConfig(storage)
  if (migration.unsupportedFutureSchema) return migration.device
  const current = migration.device
  const candidate = typeof updater === 'function' ? updater(current) : updater
  const validated = validateDeviceConfig(candidate)
  return validated && safeWrite(storage, DEVICE_CONFIG_STORAGE_KEY, validated) ? validated : current
}
