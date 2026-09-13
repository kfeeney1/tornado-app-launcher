const accountKeys = uid => [
  `tornado-account-portable-v1:${uid}`,
  `tornado-account-portable-meta-v1:${uid}`,
  `tornado-sync-pending-v1:${uid}`,
  `tornado-test-devices-v1:${uid}`,
  `tornado-test-profile-v1:${uid}`,
  `tornado-test-cloud-v1:${uid}:appearance`,
  `tornado-test-cloud-v1:${uid}:launcher`,
  `tornado-test-cloud-v1:${uid}:preferences`,
]

export function clearAccountOwnedLocalData(uid, store = globalThis.localStorage) {
  if (!uid || !store) return false
  try {
    for (const key of accountKeys(uid)) store.removeItem(key)
    const legacyOwnerKey = 'tornado-portable-legacy-owner-v1'
    const rawOwner = store.getItem(legacyOwnerKey)
    if (rawOwner) {
      try {
        if (JSON.parse(rawOwner) === uid) store.removeItem(legacyOwnerKey)
      } catch {
        if (rawOwner === uid) store.removeItem(legacyOwnerKey)
      }
    }
    return true
  } catch {
    return false
  }
}

export function accountOwnedLocalKeys(uid) {
  return accountKeys(uid)
}
