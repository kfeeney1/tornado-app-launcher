const PREFIX = 'tornado-sync-pending-v1:'
const allowed = new Set(['appearance', 'launcher', 'preferences'])

function key(uid) { return `${PREFIX}${uid}` }

export function loadPendingDomains(uid) {
  try {
    const value = JSON.parse(localStorage.getItem(key(uid)) || '[]')
    return new Set(Array.isArray(value) ? value.filter(domain => allowed.has(domain)) : [])
  } catch { return new Set() }
}

export function savePendingDomains(uid, domains) {
  try {
    localStorage.setItem(key(uid), JSON.stringify([...domains].filter(domain => allowed.has(domain))))
    return true
  } catch { return false }
}

export function markPending(uid, domain) {
  const pending = loadPendingDomains(uid)
  pending.add(domain)
  savePendingDomains(uid, pending)
}

export function clearPending(uid, domain) {
  const pending = loadPendingDomains(uid)
  pending.delete(domain)
  savePendingDomains(uid, pending)
}
