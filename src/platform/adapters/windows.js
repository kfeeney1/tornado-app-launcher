import { PLATFORM_CAPABILITIES, PLATFORM_KINDS, supported } from '../contracts.js'
import { isAllowedExternalUrl } from '../urlPolicy.js'

function isLaunchTarget(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && typeof value.appId === 'string'
    && ['protocol', 'installed-app'].includes(value.type),
  )
}

function sanitizeInstalledApps(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const apps = []
  for (const item of value) {
    if (!item || typeof item !== 'object' || typeof item.appId !== 'string') continue
    if (seen.has(item.appId)) continue
    seen.add(item.appId)
    apps.push(Object.freeze({ appId: item.appId, source: item.source === 'start-menu' ? 'start-menu' : 'windows' }))
  }
  return apps
}

function sanitizeGameResolution(value, appId) {
  if (!value || typeof value !== 'object' || value.appId !== appId || typeof value.installed !== 'boolean') return null
  const launchers = new Set(['minecraft-launcher', 'roblox', 'epic-games'])
  return Object.freeze({
    appId,
    installed: value.installed,
    launcher: launchers.has(value.launcher) ? value.launcher : null,
  })
}

export function createWindowsAdapter(bridge) {
  const kind = PLATFORM_KINDS.WINDOWS
  const capabilities = new Set([PLATFORM_CAPABILITIES.OPEN_EXTERNAL])
  if (typeof bridge?.launchNativeApp === 'function') capabilities.add(PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH)
  if (typeof bridge?.getInstalledApps === 'function') capabilities.add(PLATFORM_CAPABILITIES.INSTALLED_APP_DISCOVERY)
  if (typeof bridge?.resolveGame === 'function') capabilities.add(PLATFORM_CAPABILITIES.GAME_RESOLUTION)

  return Object.freeze({
    kind,
    getPlatform: () => kind,
    getCapabilities: () => [...capabilities],
    can: capability => capabilities.has(capability),
    async openExternal(url) {
      if (!isAllowedExternalUrl(url)) return { ok: false, reason: 'invalid-url' }
      if (!bridge?.openExternal) return { ok: false, reason: 'bridge-unavailable' }
      try {
        const result = await bridge.openExternal(url)
        return result === true ? supported(true) : { ok: false, reason: 'open-failed' }
      } catch {
        return { ok: false, reason: 'open-failed' }
      }
    },
    async launchTarget(target) {
      if (!isLaunchTarget(target)) return { ok: false, reason: 'invalid-target' }
      if (!capabilities.has(PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH)) return { ok: false, reason: 'unsupported', capability: PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH, platform: kind }
      try {
        const result = await bridge.launchNativeApp({ appId: target.appId, type: target.type })
        return result === true ? supported(true) : { ok: false, reason: 'launch-failed' }
      } catch {
        return { ok: false, reason: 'launch-failed' }
      }
    },
    async getInstalledApps() {
      if (!capabilities.has(PLATFORM_CAPABILITIES.INSTALLED_APP_DISCOVERY)) return { ok: false, reason: 'unsupported', capability: PLATFORM_CAPABILITIES.INSTALLED_APP_DISCOVERY, platform: kind }
      try {
        return supported(sanitizeInstalledApps(await bridge.getInstalledApps()))
      } catch {
        return { ok: false, reason: 'discovery-failed' }
      }
    },
    async resolveGame(appId) {
      if (typeof appId !== 'string' || !appId) return { ok: false, reason: 'invalid-target' }
      if (!capabilities.has(PLATFORM_CAPABILITIES.GAME_RESOLUTION)) return { ok: false, reason: 'unsupported', capability: PLATFORM_CAPABILITIES.GAME_RESOLUTION, platform: kind }
      try {
        const resolution = sanitizeGameResolution(await bridge.resolveGame(appId), appId)
        return resolution ? supported(resolution) : { ok: false, reason: 'resolution-failed' }
      } catch {
        return { ok: false, reason: 'resolution-failed' }
      }
    },
  })
}
