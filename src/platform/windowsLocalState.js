import { getDeviceConfig, updateDeviceConfig } from '../config/localConfig.js'
import { isStableTornadoId } from '../cloud/schema.js'

export const WINDOWS_RESOLUTION_TTL_MS = 5 * 60 * 1000

function browserStorage() {
  try { return globalThis.localStorage ?? null } catch { return null }
}

export function getCachedWindowsResolution(appId, storage = browserStorage(), now = Date.now()) {
  if (!isStableTornadoId(appId)) return null
  const state = getDeviceConfig(storage).installedApps?.[appId]
  if (!state || !Number.isFinite(state.checkedAt)) return null
  if (now - state.checkedAt > WINDOWS_RESOLUTION_TTL_MS) return null
  return { ...state }
}

export function cacheWindowsResolution(appId, resolution, storage = browserStorage(), now = Date.now(), source = 'game-resolver') {
  if (!isStableTornadoId(appId) || !resolution || typeof resolution.installed !== 'boolean') return null
  const updated = updateDeviceConfig(config => ({
    ...config,
    installedApps: {
      ...config.installedApps,
      [appId]: {
        installed: resolution.installed,
        launcher: resolution.launcher ?? null,
        source,
        checkedAt: now,
      },
    },
  }), storage)
  return updated.installedApps?.[appId] ?? null
}

export function cacheDiscoveredWindowsApps(apps, storage = browserStorage(), now = Date.now()) {
  if (!Array.isArray(apps)) return []
  const validIds = apps.map(app => app?.appId).filter(isStableTornadoId)
  updateDeviceConfig(config => {
    const installedApps = { ...config.installedApps }
    for (const appId of validIds) {
      installedApps[appId] = { installed: true, launcher: null, source: 'discovery', checkedAt: now }
    }
    return { ...config, installedApps }
  }, storage)
  return validIds
}

export function invalidateWindowsResolution(appId, storage = browserStorage()) {
  if (!isStableTornadoId(appId)) return false
  const before = getDeviceConfig(storage)
  if (!before.installedApps?.[appId] && !before.launchTargets?.[appId]) return false
  updateDeviceConfig(config => {
    const installedApps = { ...config.installedApps }
    const launchTargets = { ...config.launchTargets }
    delete installedApps[appId]
    delete launchTargets[appId]
    return { ...config, installedApps, launchTargets }
  }, storage)
  return true
}
