import { getDeviceConfig, updateDeviceConfig } from '../config/localConfig.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function browserStorage() {
  try { return globalThis.localStorage ?? null } catch { return null }
}

export function isValidDeviceId(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

function fallbackUuid() {
  const bytes = new Uint8Array(16)
  globalThis.crypto?.getRandomValues?.(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map(value => value.toString(16).padStart(2, '0'))
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`
}

export function generateDeviceId() {
  const candidate = globalThis.crypto?.randomUUID?.() ?? fallbackUuid()
  if (!isValidDeviceId(candidate)) throw new Error('devices/device-id-generation-failed')
  return candidate
}

export function getOrCreateDeviceId(storage = browserStorage()) {
  const existing = getDeviceConfig(storage).installationId
  if (isValidDeviceId(existing)) return existing
  const deviceId = generateDeviceId()
  const updated = updateDeviceConfig(current => ({ ...current, installationId: deviceId }), storage)
  return isValidDeviceId(updated.installationId) ? updated.installationId : deviceId
}

export function detectClientPlatform() {
  try {
    const nativePlatform = globalThis.Capacitor?.getPlatform?.()
    if (nativePlatform === 'android') return 'android'
    if (nativePlatform === 'windows') return 'windows'
  } catch {
    // Fall back to web below.
  }
  return 'web'
}

export function detectClientType(platform = detectClientPlatform()) {
  return platform === 'web' ? 'browser' : 'native'
}

function browserName(userAgent = globalThis.navigator?.userAgent ?? '') {
  if (/Edg\//i.test(userAgent)) return 'Edge'
  if (/Firefox\//i.test(userAgent)) return 'Firefox'
  if (/Chrome\//i.test(userAgent) || /CriOS\//i.test(userAgent)) return 'Chrome'
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return 'Safari'
  return 'Browser'
}

function operatingSystemName(userAgent = globalThis.navigator?.userAgent ?? '') {
  if (/Android/i.test(userAgent)) return 'Android'
  if (/Windows/i.test(userAgent)) return 'Windows'
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS'
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macOS'
  if (/Linux/i.test(userAgent)) return 'Linux'
  return ''
}

export function defaultDeviceName(platform = detectClientPlatform(), userAgent = globalThis.navigator?.userAgent ?? '') {
  if (platform === 'android') return 'Tornado Android'
  if (platform === 'windows') return 'Tornado Windows'
  const browser = browserName(userAgent)
  const os = operatingSystemName(userAgent)
  return os ? `${browser} on ${os}` : browser
}

export function getAppVersion() {
  return typeof __TORNADO_APP_VERSION__ === 'string' ? __TORNADO_APP_VERSION__ : null
}

export function buildCurrentDeviceMetadata() {
  const platform = detectClientPlatform()
  return {
    platform,
    deviceName: defaultDeviceName(platform),
    clientType: detectClientType(platform),
    appVersion: getAppVersion(),
  }
}
