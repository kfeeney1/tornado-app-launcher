export type PlatformKind = 'web' | 'windows' | 'android'

export type PlatformCapability =
  | 'open-external'
  | 'native-app-launch'
  | 'local-filesystem'
  | 'installed-app-discovery'
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

export interface TornadoPlatform {
  readonly kind: PlatformKind
  getPlatform(): PlatformKind
  getCapabilities(): PlatformCapability[]
  can(capability: PlatformCapability): boolean
  openExternal(url: string): Promise<PlatformResult>
  launchTarget(target: LaunchTarget): Promise<PlatformResult>
  getInstalledApps?(): Promise<PlatformResult<InstalledApplication[]>>
}

export interface TornadoDesktopBridge {
  getPlatform(): 'windows'
  openExternal(url: string): Promise<boolean>
  launchNativeApp?(target: { appId: string; type: 'protocol' }): Promise<boolean>
  getInstalledApps?(): Promise<InstalledApplication[]>
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
