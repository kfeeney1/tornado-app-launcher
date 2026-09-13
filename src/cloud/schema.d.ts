export type { TornadoDeviceConfig, TornadoPortableConfig } from '../config/schema'

export type TornadoTheme = 'dark' | 'light'
export type TornadoItemType = 'app' | 'game'

export interface FirestoreTimestampLike {
  toMillis(): number
}

export interface TornadoUserProfile {
  schemaVersion: 1
  email: string | null
  displayName: string | null
  createdAt: FirestoreTimestampLike
  updatedAt: FirestoreTimestampLike
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

export type CloudReadResult<T> =
  | { status: 'missing'; data: null }
  | { status: 'ready'; data: T }
  | { status: 'malformed'; data: null }
  | { status: 'unsupported'; data: null }
