export const DEVICE_RECORD_SCHEMA_VERSION = 1
export const DEVICE_PLATFORMS = ['web', 'android', 'windows', 'unknown']

export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (value && typeof value.toDate === 'function') return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function normalizeDeviceRecord(value, fallbackId = '') {
  if (!value || typeof value !== 'object' || value.schemaVersion !== 1) return null
  const deviceId = typeof value.deviceId === 'string' && value.deviceId ? value.deviceId : fallbackId
  if (!deviceId || !DEVICE_PLATFORMS.includes(value.platform)) return null
  if (typeof value.deviceName !== 'string' || !value.deviceName.trim()) return null
  if (typeof value.clientType !== 'string' || !value.clientType.trim()) return null
  if (value.appVersion != null && typeof value.appVersion !== 'string') return null
  return { schemaVersion: 1, deviceId, platform: value.platform, deviceName: value.deviceName.trim(), clientType: value.clientType.trim(), appVersion: value.appVersion ?? null, createdAt: value.createdAt ?? null, lastSeenAt: value.lastSeenAt ?? null }
}

export function sortDevices(records, currentDeviceId) {
  return [...records].sort((a, b) => {
    if (a.deviceId === currentDeviceId && b.deviceId !== currentDeviceId) return -1
    if (b.deviceId === currentDeviceId && a.deviceId !== currentDeviceId) return 1
    return (toDate(b.lastSeenAt)?.getTime() ?? 0) - (toDate(a.lastSeenAt)?.getTime() ?? 0)
  })
}

export function formatLastActive(value, now = new Date()) {
  const date = toDate(value)
  if (!date) return 'Last active unknown'
  const diff = Math.max(0, now.getTime() - date.getTime())
  if (diff < 120000) return 'Active now'
  if (diff < 3600000) return `${Math.max(2, Math.floor(diff / 60000))} minutes ago`
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (date >= today) return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  if (date >= yesterday) return 'Yesterday'
  return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric' })
}
