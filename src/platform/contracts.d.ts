export type PlatformKind = 'web' | 'windows' | 'android'

export type PlatformCapability =
  | 'open-external'
  | 'native-app-launch'
  | 'local-filesystem'
  | 'installed-app-discovery'
  | 'desktop-window-controls'
  | 'native-notifications'

export type PlatformResult<T = true> =
  | { ok: true; value: T }
  | { ok: false; reason: 'unsupported' | 'invalid-url' | 'blocked' | 'bridge-unavailable' | 'plugin-unavailable' | 'open-failed'; capability?: PlatformCapability; platform?: PlatformKind }

export type LaunchTarget =
  | { type: 'url'; appId: string; url: string | null; fallbackUrl?: string | null }
  | { type: 'protocol'; appId: string; protocol: string; fallbackUrl?: string | null }
  | { type: 'registered-app'; appId: string }

export interface InstalledApplication {
  id: string
  name: string
  icon?: string
  source?: string
  launchTarget?: LaunchTarget
}

export interface TornadoPlatform {
  readonly kind: PlatformKind
  getPlatform(): PlatformKind
  getCapabilities(): PlatformCapability[]
  can(capability: PlatformCapability): boolean
  openExternal(url: string): Promise<PlatformResult>
  launchTarget(target: LaunchTarget): Promise<PlatformResult>
}

export interface TornadoDesktopBridge {
  getPlatform(): 'windows'
  openExternal(url: string): Promise<boolean>
}

declare global {
  interface Window {
    tornadoPlatform?: TornadoDesktopBridge
    Capacitor?: {
      getPlatform?: () => string
      Plugins?: {
        Browser?: { open?: (options: { url: string }) => Promise<unknown> }
      }
    }
  }
}
