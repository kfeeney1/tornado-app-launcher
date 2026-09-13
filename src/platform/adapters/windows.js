import { PLATFORM_CAPABILITIES, PLATFORM_KINDS, supported, unsupported } from '../contracts.js'
import { isAllowedExternalUrl } from '../urlPolicy.js'

export function createWindowsAdapter(bridge) {
  const kind = PLATFORM_KINDS.WINDOWS
  const capabilities = new Set([PLATFORM_CAPABILITIES.OPEN_EXTERNAL])

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
    launchTarget: async () => unsupported(PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH, kind),
  })
}
