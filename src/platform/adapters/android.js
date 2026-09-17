import { AppLauncher } from '@capacitor/app-launcher'
import { Browser } from '@capacitor/browser'
import { PLATFORM_CAPABILITIES, PLATFORM_KINDS, supported } from '../contracts.js'
import { isAllowedExternalUrl } from '../urlPolicy.js'

export function createAndroidAdapter(_capacitor, browser = Browser, appLauncher = AppLauncher) {
  const kind = PLATFORM_KINDS.ANDROID
  const capabilities = new Set([PLATFORM_CAPABILITIES.OPEN_EXTERNAL, PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH])

  return Object.freeze({
    kind,
    getPlatform: () => kind,
    getCapabilities: () => [...capabilities],
    can: capability => capabilities.has(capability),
    async openExternal(url) {
      if (!isAllowedExternalUrl(url)) return { ok: false, reason: 'invalid-url' }
      if (!browser?.open) return { ok: false, reason: 'plugin-unavailable' }
      try {
        await browser.open({ url })
        return supported(true)
      } catch {
        return { ok: false, reason: 'open-failed' }
      }
    },
    async launchTarget(target) {
      const url = target?.protocol || target?.packageName
      if (!url || !appLauncher?.openUrl) return { ok: false, reason: 'invalid-launch-target' }
      try {
        if (appLauncher.canOpenUrl) {
          const available = await appLauncher.canOpenUrl({ url })
          if (!available?.value) return { ok: false, reason: 'not-installed' }
        }
        const result = await appLauncher.openUrl({ url })
        return result?.completed === false ? { ok: false, reason: 'open-failed' } : supported(true)
      } catch {
        return { ok: false, reason: 'open-failed' }
      }
    },
  })
}
