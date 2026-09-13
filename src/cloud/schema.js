export const PROFILE_SCHEMA_VERSION = 1
export const APPEARANCE_SCHEMA_VERSION = 1
export const LAUNCHER_SCHEMA_VERSION = 1
export const PREFERENCES_SCHEMA_VERSION = 1

const stableIdPattern = /^[a-z0-9][a-z0-9-]*$/
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isTimestampLike = value => value && typeof value.toMillis === 'function'

export function isStableTornadoId(value) {
  return typeof value === 'string' && stableIdPattern.test(value)
}

export function validateUserProfile(data) {
  if (!isObject(data)) return null
  if (data.schemaVersion !== PROFILE_SCHEMA_VERSION) return null
  if (data.email !== null && typeof data.email !== 'string') return null
  if (data.displayName !== null && typeof data.displayName !== 'string') return null
  if (!isTimestampLike(data.createdAt) || !isTimestampLike(data.updatedAt)) return null
  return data
}

export function validateAppearanceConfig(data) {
  if (!isObject(data) || data.schemaVersion !== APPEARANCE_SCHEMA_VERSION) return null
  if (data.theme !== 'dark' && data.theme !== 'light') return null
  return { schemaVersion: APPEARANCE_SCHEMA_VERSION, theme: data.theme }
}

export function validateLauncherConfig(data) {
  if (!isObject(data) || data.schemaVersion !== LAUNCHER_SCHEMA_VERSION) return null
  if (!Array.isArray(data.selectedItemIds) || data.selectedItemIds.length > 10) return null
  if (!data.selectedItemIds.every(isStableTornadoId)) return null
  if (new Set(data.selectedItemIds).size !== data.selectedItemIds.length) return null
  return { schemaVersion: LAUNCHER_SCHEMA_VERSION, selectedItemIds: [...data.selectedItemIds] }
}

export function validatePreferencesConfig(data) {
  if (!isObject(data) || data.schemaVersion !== PREFERENCES_SCHEMA_VERSION) return null
  return { schemaVersion: PREFERENCES_SCHEMA_VERSION }
}

export function classifyCloudDocument(name, data) {
  const entries = {
    appearance: [APPEARANCE_SCHEMA_VERSION, validateAppearanceConfig],
    launcher: [LAUNCHER_SCHEMA_VERSION, validateLauncherConfig],
    preferences: [PREFERENCES_SCHEMA_VERSION, validatePreferencesConfig],
  }
  const entry = entries[name]
  if (!entry) return { status: 'unsupported', data: null }
  const [currentVersion, validator] = entry
  if (isObject(data) && Number.isInteger(data.schemaVersion) && data.schemaVersion > currentVersion) {
    return { status: 'unsupported', data: null }
  }
  const validated = validator(data)
  return validated ? { status: 'ready', data: validated } : { status: 'malformed', data: null }
}
