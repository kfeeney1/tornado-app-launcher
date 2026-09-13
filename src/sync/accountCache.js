import { createDefaultPortableConfig, getPortableConfig, validatePortableConfig } from '../config/localConfig.js'

const PREFIX = 'tornado-account-portable-v1:'
const LEGACY_OWNER_KEY = 'tornado-portable-legacy-owner-v1'

function storage() {
  try { return globalThis.localStorage ?? null } catch { return null }
}

function read(store, key) {
  try {
    const raw = store?.getItem(key)
    return raw == null ? null : JSON.parse(raw)
  } catch { return null }
}

function write(store, key, value) {
  try {
    store?.setItem(key, JSON.stringify(value))
    return Boolean(store)
  } catch { return false }
}

export function accountCacheKey(uid) {
  return `${PREFIX}${uid}`
}

export function loadAccountPortable(uid, store = storage()) {
  if (!uid) return createDefaultPortableConfig()
  const cached = validatePortableConfig(read(store, accountCacheKey(uid)))
  if (cached) return cached

  const owner = read(store, LEGACY_OWNER_KEY)
  if (owner == null || owner === uid) {
    const legacy = getPortableConfig(store)
    if (write(store, accountCacheKey(uid), legacy)) write(store, LEGACY_OWNER_KEY, uid)
    return legacy
  }

  const fallback = createDefaultPortableConfig()
  write(store, accountCacheKey(uid), fallback)
  return fallback
}

export function saveAccountPortable(uid, portable, store = storage()) {
  const value = validatePortableConfig(portable)
  if (!uid || !value) return false
  return write(store, accountCacheKey(uid), value)
}
