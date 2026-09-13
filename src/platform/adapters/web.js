import { PLATFORM_CAPABILITIES, PLATFORM_KINDS, supported, unsupported } from '../contracts.js'
import { isAllowedExternalUrl } from '../urlPolicy.js'

export function createWebAdapter(runtime = globalThis) {
  const kind = PLATFORM_KINDS.WEB
  const capabilities = new Set([PLATFORM_CAPABILITIES.OPEN_EXTERNAL])

  return Object.freeze({
    kind,
    getPlatform: () => kind,
    getCapabilities: () => [...capabilities],
    can: capability => capabilities.has(capability),
    async openExternal(url) {
      if (!isAllowedExternalUrl(url)) return { ok: false, reason: 'invalid-url' }
      const opened = runtime.window?.open?.(url, '_blank', 'noopener,noreferrer')
      return opened ? supported(true) : { ok: false, reason: 'blocked' }
    },
    launchTarget: async () => unsupported(PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH, kind),
  })
}
