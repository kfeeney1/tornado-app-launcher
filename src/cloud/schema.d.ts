export type TornadoTheme = 'dark' | 'light'
export type TornadoItemType = 'app' | 'game'

export interface TornadoUserProfile {
  schemaVersion: 1
  email: string | null
  displayName: string | null
  createdAt: import('firebase/firestore').Timestamp
  updatedAt: import('firebase/firestore').Timestamp
}

export interface PortableCatalogueEntry {
  id: string
  type: TornadoItemType
}

export interface CloudAppearanceConfig {
  schemaVersion: 1
  theme: TornadoTheme
}

export interface CloudLauncherConfig {
  schemaVersion: 1
  selectedItemIds: string[]
}

export interface CloudPreferencesConfig {
  schemaVersion: 1
}

export interface DeviceSpecificConfiguration {
  androidPackageAvailability?: Record<string, boolean>
  executablePaths?: Record<string, string>
  downloadFolder?: string
  platformLaunchTargets?: Record<string, string>
  windowBounds?: { x: number; y: number; width: number; height: number }
}

export type CloudReadResult<T> =
  | { status: 'missing'; data: null }
  | { status: 'ready'; data: T }
  | { status: 'malformed'; data: null }
  | { status: 'unsupported'; data: null }
