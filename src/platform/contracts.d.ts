export type PlatformKind = 'web' | 'windows' | 'android'

export type PlatformCapability =
  | 'open-external'
  | 'native-app-launch'
  | 'local-filesystem'
  | 'installed-app-discovery'
  | 'game-resolution'
  | 'desktop-window-controls'
  | 'native-notifications'

export type PlatformFailureReason =
  | 'unsupported'
  | 'invalid-url'
  | 'invalid-target'
  | 'blocked'
  | 'bridge-unavailable'
  | 'plugin-unavailable'
  | 'open-failed'
  | 'launch-failed'
  | 'discovery-failed'
  | 'resolution-failed'

export type PlatformResult<T = true> =
  | { ok: true; value: T }
  | { ok: false; reason: PlatformFailureReason; capability?: PlatformCapability; platform?: PlatformKind }

export type LaunchTarget =
  | { type: 'url'; appId: string; url: string | null; fallbackUrl?: string | null }
  | { type: 'protocol'; appId: string; protocol: string; fallbackUrl?: string | null }
  | { type: 'registered-app'; appId: string }

export interface InstalledApplication {
  appId: string
  source: 'start-menu' | 'windows'
}

export interface GameResolution {
  appId: string
  installed: boolean
  launcher: 'minecraft-launcher' | 'roblox' | 'epic-games' | null
}

export interface TornadoPlatform {
  readonly kind: PlatformKind
  getPlatform(): PlatformKind
  getCapabilities(): PlatformCapability[]
  can(capability: PlatformCapability): boolean
  openExternal(url: string): Promise<PlatformResult>
  launchTarget(target: LaunchTarget): Promise<PlatformResult>
  getInstalledApps?(): Promise<PlatformResult<InstalledApplication[]>>
  resolveGame?(appId: string): Promise<PlatformResult<GameResolution>>
}

export interface TornadoDesktopBridge {
  getPlatform(): 'windows'
  openExternal(url: string): Promise<boolean>
  launchNativeApp?(target: { appId: string; type: 'protocol' }): Promise<boolean>
  getInstalledApps?(): Promise<InstalledApplication[]>
  resolveGame?(appId: string): Promise<GameResolution | null>
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
