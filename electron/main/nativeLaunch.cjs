const NATIVE_LAUNCH_TARGETS = Object.freeze({
  minecraft: Object.freeze({ type: 'protocol', value: 'minecraft://' }),
  fortnite: Object.freeze({ type: 'protocol', value: 'com.epicgames.launcher://apps/fn%3A4fe75bbc5a674f4f9b356b5c90567da5%3AFortnite?action=launch&silent=true' }),
  roblox: Object.freeze({ type: 'protocol', value: 'roblox://' }),
})

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function resolveNativeLaunchTarget(payload) {
  if (!isPlainObject(payload)) return null
  if (Object.keys(payload).some(key => !['appId', 'type'].includes(key))) return null
  if (payload.type !== 'protocol' || typeof payload.appId !== 'string') return null
  const target = NATIVE_LAUNCH_TARGETS[payload.appId]
  if (!target || target.type !== payload.type) return null
  return target.value
}

module.exports = { NATIVE_LAUNCH_TARGETS, resolveNativeLaunchTarget }
