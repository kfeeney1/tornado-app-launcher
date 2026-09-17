import { PLATFORM_KINDS } from './contracts.js'
import { createAndroidAdapter } from './adapters/android.js'
import { createWebAdapter } from './adapters/web.js'
import { createWindowsAdapter } from './adapters/windows.js'

function getRuntimeWindow(runtime) {
  return runtime?.window ?? (typeof window !== 'undefined' ? window : undefined)
}

export function createPlatform(runtime = globalThis) {
  const runtimeWindow = getRuntimeWindow(runtime)
  const bridge = runtimeWindow?.tornadoPlatform
  if (bridge?.getPlatform?.() === PLATFORM_KINDS.WINDOWS && typeof bridge.openExternal === 'function') {
    return createWindowsAdapter(bridge)
  }

  const capacitor = runtimeWindow?.Capacitor
  if (capacitor && typeof capacitor.getPlatform === 'function' && capacitor.getPlatform() === PLATFORM_KINDS.ANDROID) {
    // The second argument keeps the adapter unit-testable without changing the
    // production default, which is the official imported Capacitor Browser plugin.
    return createAndroidAdapter(capacitor, capacitor?.Plugins?.Browser)
  }

  return createWebAdapter({ ...runtime, window: runtimeWindow })
}

export const platform = createPlatform()

export const getPlatform = () => platform.getPlatform()
export const getCapabilities = () => platform.getCapabilities()
export const can = capability => platform.can(capability)
export const openExternal = url => platform.openExternal(url)
export const isDesktop = () => platform.kind === PLATFORM_KINDS.WINDOWS
export const isWeb = () => platform.kind === PLATFORM_KINDS.WEB
export const isAndroid = () => platform.kind === PLATFORM_KINDS.ANDROID

export { PLATFORM_CAPABILITIES, PLATFORM_KINDS, UnsupportedPlatformOperationError } from './contracts.js'
