export type TornadoPlatform = 'web' | 'android' | 'windows' | 'unknown'
export type TornadoTheme = 'dark' | 'light'

export interface TornadoPortableConfig {
  schemaVersion: 1
  appearance: { theme: TornadoTheme }
  launcher: { selectedItemIds: string[] }
  preferences: { [key: string]: unknown }
}

export interface TornadoLocalLaunchTarget {
  executablePath?: string
  source?: 'discovery' | 'game-resolver' | 'manual'
  updatedAt?: number
}

export interface TornadoInstalledAppState {
  installed: boolean
  launcher: 'minecraft-launcher' | 'roblox' | 'epic-games' | null
  source: 'discovery' | 'game-resolver' | 'manual'
  checkedAt: number
}

export interface TornadoDeviceConfig {
  schemaVersion: 2
  platform: TornadoPlatform
  installationId: string | null
  launchTargets: { [itemId: string]: TornadoLocalLaunchTarget }
  installedApps: { [itemId: string]: TornadoInstalledAppState }
  nativePreferences: { [key: string]: string | number | boolean | null }
}
