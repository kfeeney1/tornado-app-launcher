import { createDefaultPortableConfig, inspectLocalPortableState, validatePortableConfig } from '../config/localConfig.js'

const PREFIX = 'tornado-account-portable-v1:'
const META_PREFIX = 'tornado-account-portable-meta-v1:'
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

export function accountCacheMetaKey(uid) {
  return `${META_PREFIX}${uid}`
}

function validMeta(value, uid) {
  if (!value || value.ownerUid !== uid) return null
  if (!['fresh', 'legacy', 'account'].includes(value.source)) return null
  return { ownerUid: uid, source: value.source, reconciled: value.reconciled === true }
}

function saveMeta(uid, meta, store) {
  return write(store, accountCacheMetaKey(uid), { ownerUid: uid, source: meta.source, reconciled: meta.reconciled === true })
}

export function loadAccountPortableState(uid, store = storage()) {
  if (!uid) return { portable: createDefaultPortableConfig(), source: 'fresh', ownerUid: null, reconciled: false }

  const cached = validatePortableConfig(read(store, accountCacheKey(uid)))
  const meta = validMeta(read(store, accountCacheMetaKey(uid)), uid)
  if (cached) {
    const resolvedMeta = meta ?? { ownerUid: uid, source: 'account', reconciled: false }
    if (!meta) saveMeta(uid, resolvedMeta, store)
    return { portable: cached, ...resolvedMeta }
  }

  const claimedOwner = read(store, LEGACY_OWNER_KEY)
  if (claimedOwner != null && claimedOwner !== uid) {
    const portable = createDefaultPortableConfig()
    write(store, accountCacheKey(uid), portable)
    saveMeta(uid, { source: 'fresh', reconciled: false }, store)
    return { portable, source: 'fresh', ownerUid: uid, reconciled: false }
  }

  const legacyState = inspectLocalPortableState(store)
  const portable = validatePortableConfig(legacyState.portable) ?? createDefaultPortableConfig()
  const source = legacyState.unsupportedFutureSchema ? 'fresh' : legacyState.source
  write(store, accountCacheKey(uid), portable)
  saveMeta(uid, { source, reconciled: false }, store)
  if (source === 'legacy') write(store, LEGACY_OWNER_KEY, uid)
  return { portable, source, ownerUid: uid, reconciled: false }
}

export function loadAccountPortable(uid, store = storage()) {
  return loadAccountPortableState(uid, store).portable
}

export function saveAccountPortable(uid, portable, store = storage()) {
  const value = validatePortableConfig(portable)
  if (!uid || !value) return false
  return write(store, accountCacheKey(uid), value)
}

export function markAccountReconciled(uid, store = storage()) {
  if (!uid) return false
  const state = loadAccountPortableState(uid, store)
  return saveMeta(uid, { source: state.source === 'fresh' ? 'account' : state.source, reconciled: true }, store)
}

export function clearAccountReconciled(uid, store = storage()) {
  if (!uid) return false
  const state = loadAccountPortableState(uid, store)
  return saveMeta(uid, { source: state.source, reconciled: false }, store)
}
