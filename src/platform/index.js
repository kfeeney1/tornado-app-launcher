function electronBridge() {
  return typeof window !== 'undefined' ? window.tornadoPlatform : undefined
}

function capacitorPlatform() {
  if (typeof window === 'undefined') return null
  const capacitor = window.Capacitor
  if (!capacitor || typeof capacitor.getPlatform !== 'function') return null
  return capacitor.getPlatform()
}

export function getPlatform() {
  const bridge = electronBridge()
  if (bridge?.getPlatform?.() === 'windows') return 'windows'

  const capacitor = capacitorPlatform()
  if (capacitor === 'android') return 'android'
  if (capacitor === 'ios') return 'ios'
  return 'web'
}

export function isDesktop() {
  return getPlatform() === 'windows'
}

export function isWeb() {
  return getPlatform() === 'web'
}

export function isAndroid() {
  return getPlatform() === 'android'
}

export async function openExternal(url) {
  const bridge = electronBridge()
  if (bridge?.openExternal) return bridge.openExternal(url)

  if (typeof window === 'undefined') return false
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  return Boolean(opened)
}
