import { PLATFORM_CAPABILITIES, PLATFORM_KINDS, supported, unsupported } from '../contracts.js'
import { isAllowedExternalUrl } from '../urlPolicy.js'

export function createAndroidAdapter(capacitor) {
  const kind = PLATFORM_KINDS.ANDROID
  const capabilities = new Set([PLATFORM_CAPABILITIES.OPEN_EXTERNAL])

  return Object.freeze({
    kind,
    getPlatform: () => kind,
    getCapabilities: () => [...capabilities],
    can: capability => capabilities.has(capability),
    async openExternal(url) {
      if (!isAllowedExternalUrl(url)) return { ok: false, reason: 'invalid-url' }
      const browser = capacitor?.Plugins?.Browser
      if (browser?.open) {
        try {
          await browser.open({ url })
          return supported(true)
        } catch {
          return { ok: false, reason: 'open-failed' }
        }
      }
      const opened = globalThis.window?.open?.(url, '_blank', 'noopener,noreferrer')
      return opened ? supported(true) : { ok: false, reason: 'plugin-unavailable' }
    },
    launchTarget: async () => unsupported(PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH, kind),
  })
}
