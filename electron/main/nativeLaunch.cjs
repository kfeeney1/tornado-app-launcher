const { findInstalledAppShortcut, NATIVE_APP_IDS } = require('./installedApps.cjs')

const NATIVE_LAUNCH_TARGETS = Object.freeze({
  minecraft: Object.freeze({ type: 'protocol', value: 'minecraft://' }),
  fortnite: Object.freeze({ type: 'protocol', value: 'com.epicgames.launcher://apps/fn%3A4fe75bbc5a674f4f9b356b5c90567da5%3AFortnite?action=launch&silent=true' }),
  roblox: Object.freeze({ type: 'protocol', value: 'roblox://' }),
})

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isValidPayload(payload) {
  return isPlainObject(payload)
    && Object.keys(payload).every(key => ['appId', 'type'].includes(key))
    && typeof payload.appId === 'string'
    && ['protocol', 'installed-app'].includes(payload.type)
}

function resolveNativeLaunchTarget(payload) {
  if (!isValidPayload(payload) || payload.type !== 'protocol') return null
  const target = NATIVE_LAUNCH_TARGETS[payload.appId]
  if (!target || target.type !== payload.type) return null
  return target.value
}

async function resolveNativeLaunchRequest(payload, options = {}) {
  if (!isValidPayload(payload)) return null

  if (payload.type === 'protocol') {
    const value = resolveNativeLaunchTarget(payload)
    return value ? Object.freeze({ kind: 'external', value }) : null
  }

  if (!NATIVE_APP_IDS.has(payload.appId)) return null
  const finder = options.findInstalledAppShortcut || findInstalledAppShortcut
  const shortcutPath = await finder(payload.appId, options)
  return shortcutPath ? Object.freeze({ kind: 'path', value: shortcutPath }) : null
}

module.exports = { NATIVE_LAUNCH_TARGETS, resolveNativeLaunchRequest, resolveNativeLaunchTarget }
