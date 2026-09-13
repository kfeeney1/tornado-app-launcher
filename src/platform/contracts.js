export const PLATFORM_KINDS = Object.freeze({
  WEB: 'web',
  WINDOWS: 'windows',
  ANDROID: 'android',
})

export const PLATFORM_CAPABILITIES = Object.freeze({
  OPEN_EXTERNAL: 'open-external',
  NATIVE_APP_LAUNCH: 'native-app-launch',
  LOCAL_FILESYSTEM: 'local-filesystem',
  INSTALLED_APP_DISCOVERY: 'installed-app-discovery',
  GAME_RESOLUTION: 'game-resolution',
  DESKTOP_WINDOW_CONTROLS: 'desktop-window-controls',
  NATIVE_NOTIFICATIONS: 'native-notifications',
})

export class UnsupportedPlatformOperationError extends Error {
  constructor(capability, platformKind) {
    super(`${capability} is not supported on ${platformKind}`)
    this.name = 'UnsupportedPlatformOperationError'
    this.code = 'PLATFORM_UNSUPPORTED'
    this.capability = capability
    this.platformKind = platformKind
  }
}

export function unsupported(capability, platformKind) {
  return Object.freeze({ ok: false, reason: 'unsupported', capability, platform: platformKind })
}

export function supported(value = true) {
  return Object.freeze({ ok: true, value })
}
