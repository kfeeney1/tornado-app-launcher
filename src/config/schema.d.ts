export type TornadoPlatform = 'web' | 'android' | 'windows' | 'unknown'
export type TornadoTheme = 'dark' | 'light'

export interface TornadoPortableConfig {
  schemaVersion: 1
  appearance: { theme: TornadoTheme }
  launcher: { selectedItemIds: string[] }
  preferences: { [key: string]: unknown }
}

export interface TornadoDeviceConfig {
  schemaVersion: 1
  platform: TornadoPlatform
  launchTargets: { [itemId: string]: unknown }
  nativePreferences: { [key: string]: unknown }
}
