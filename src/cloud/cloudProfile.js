import { APPEARANCE_SCHEMA_VERSION, LAUNCHER_SCHEMA_VERSION, PREFERENCES_SCHEMA_VERSION, PROFILE_SCHEMA_VERSION, classifyCloudDocument, validateUserProfile } from './schema.js'

const firebaseVersion = '11.10.0'
const appModuleUrl = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`
const firestoreModuleUrl = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-firestore.js`
let firestorePromise = null

async function getFirestoreModules() {
  if (!firestorePromise) {
    firestorePromise = Promise.all([
      import(/* @vite-ignore */ appModuleUrl),
      import(/* @vite-ignore */ firestoreModuleUrl),
    ]).then(([appModule, firestoreModule]) => {
      if (!appModule.getApps().length) throw new Error('cloud/firebase-not-initialized')
      return { firestoreModule, db: firestoreModule.getFirestore(appModule.getApp()) }
    })
  }
  return firestorePromise
}

function assertUid(uid) {
  if (!uid || typeof uid !== 'string') throw new Error('cloud/invalid-user')
}

function profileRef(firestoreModule, db, uid) {
  return firestoreModule.doc(db, 'users', uid)
}

function configRef(firestoreModule, db, uid, name) {
  return firestoreModule.doc(db, 'users', uid, 'config', name)
}

export async function ensureUserProfile(user) {
  if (!user?.uid) throw new Error('cloud/invalid-user')
  if (import.meta.env.VITE_AUTH_TEST_MODE === 'true') {
    return { status: 'ready', data: { schemaVersion: PROFILE_SCHEMA_VERSION, email: user.email ?? null, displayName: user.displayName ?? null } }
  }
  const { firestoreModule, db } = await getFirestoreModules()
  const ref = profileRef(firestoreModule, db, user.uid)
  await firestoreModule.runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref)
    if (snapshot.exists()) return
    transaction.set(ref, {
      schemaVersion: PROFILE_SCHEMA_VERSION,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      createdAt: firestoreModule.serverTimestamp(),
      updatedAt: firestoreModule.serverTimestamp(),
    })
  })
  return getUserProfile(user.uid)
}

export async function getUserProfile(uid) {
  assertUid(uid)
  const { firestoreModule, db } = await getFirestoreModules()
  const snapshot = await firestoreModule.getDoc(profileRef(firestoreModule, db, uid))
  if (!snapshot.exists()) return { status: 'missing', data: null }
  const data = validateUserProfile(snapshot.data())
  return data ? { status: 'ready', data } : { status: 'malformed', data: null }
}

async function getConfig(uid, name) {
  assertUid(uid)
  const { firestoreModule, db } = await getFirestoreModules()
  const snapshot = await firestoreModule.getDoc(configRef(firestoreModule, db, uid, name))
  if (!snapshot.exists()) return { status: 'missing', data: null }
  return classifyCloudDocument(name, snapshot.data())
}

async function setConfig(uid, name, value) {
  assertUid(uid)
  const validation = classifyCloudDocument(name, value)
  if (validation.status !== 'ready') throw new Error('cloud/invalid-config')
  const { firestoreModule, db } = await getFirestoreModules()
  await firestoreModule.setDoc(configRef(firestoreModule, db, uid, name), validation.data)
  return validation.data
}

export async function subscribeConfig(uid, name, onValue, onError) {
  assertUid(uid)
  const { firestoreModule, db } = await getFirestoreModules()
  return firestoreModule.onSnapshot(
    configRef(firestoreModule, db, uid, name),
    snapshot => onValue(snapshot.exists() ? classifyCloudDocument(name, snapshot.data()) : { status: 'missing', data: null }),
    onError,
  )
}

export const getAppearanceConfig = uid => getConfig(uid, 'appearance')
export const getLauncherConfig = uid => getConfig(uid, 'launcher')
export const getPreferences = uid => getConfig(uid, 'preferences')
export const subscribeAppearanceConfig = (uid, next, error) => subscribeConfig(uid, 'appearance', next, error)
export const subscribeLauncherConfig = (uid, next, error) => subscribeConfig(uid, 'launcher', next, error)
export const subscribePreferences = (uid, next, error) => subscribeConfig(uid, 'preferences', next, error)

export const setAppearanceConfig = (uid, config) => setConfig(uid, 'appearance', { schemaVersion: APPEARANCE_SCHEMA_VERSION, ...config })
export const setLauncherConfig = (uid, config) => setConfig(uid, 'launcher', { schemaVersion: LAUNCHER_SCHEMA_VERSION, ...config })
export const setPreferences = (uid, config = {}) => setConfig(uid, 'preferences', { schemaVersion: PREFERENCES_SCHEMA_VERSION, ...config })

export function describeCloudError(error) {
  const code = error?.code || error?.message || ''
  if (code.includes('permission-denied')) return 'Tornado could not access your synced settings.'
  if (code.includes('unavailable') || code.includes('network')) return 'Tornado is offline. Local changes will remain available.'
  if (code.includes('unsupported')) return 'Your synced settings use a newer Tornado format.'
  return 'Tornado sync needs attention. Your local launcher is still available.'
}
