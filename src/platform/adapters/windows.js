import { PLATFORM_CAPABILITIES, PLATFORM_KINDS, supported } from '../contracts.js'
import { isAllowedExternalUrl } from '../urlPolicy.js'

function isLaunchTarget(value) {
  return Boolean(value && typeof value === 'object' && typeof value.appId === 'string' && value.type === 'protocol')
}

export function createWindowsAdapter(bridge) {
  const kind = PLATFORM_KINDS.WINDOWS
  const capabilities = new Set([PLATFORM_CAPABILITIES.OPEN_EXTERNAL])
  if (typeof bridge?.launchNativeApp === 'function') capabilities.add(PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH)

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
  })
}
