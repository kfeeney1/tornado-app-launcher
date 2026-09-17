import { APPEARANCE_SCHEMA_VERSION, LAUNCHER_SCHEMA_VERSION, PREFERENCES_SCHEMA_VERSION, PROFILE_SCHEMA_VERSION, classifyCloudDocument, validateUserProfile } from './schema.js'

import { getFirestore, doc, runTransaction, serverTimestamp, getDoc, updateDoc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore'
import { getFirebaseClientApp } from '../config/firebaseRuntime.js'

async function getFirestoreModules() {
  return { firestoreModule: { doc, runTransaction, serverTimestamp, getDoc, updateDoc, onSnapshot, setDoc, writeBatch }, db: getFirestore(getFirebaseClientApp()) }
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

function testProfileKey(uid) { return `tornado-test-profile-v1:${uid}` }

function readTestProfile(uid) {
  try { return JSON.parse(localStorage.getItem(testProfileKey(uid)) || 'null') } catch { return null }
}

function writeTestProfile(uid, profile) {
  localStorage.setItem(testProfileKey(uid), JSON.stringify(profile))
  window.dispatchEvent(new CustomEvent('tornado-test-profile-change', { detail: { uid } }))
  return profile
}

function createTestProfile(user, existing = null) {
  const now = new Date().toISOString()
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    email: user.email ?? existing?.email ?? null,
    displayName: existing?.displayName ?? user.displayName ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

export async function ensureUserProfile(user) {
  if (!user?.uid) throw new Error('cloud/invalid-user')
  if (import.meta.env.VITE_AUTH_TEST_MODE === 'true') {
    const existing = readTestProfile(user.uid)
    return { status: 'ready', data: existing ?? writeTestProfile(user.uid, createTestProfile(user)) }
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
  if (import.meta.env.VITE_AUTH_TEST_MODE === 'true') {
    const data = readTestProfile(uid)
    return data ? { status: 'ready', data } : { status: 'missing', data: null }
  }
  const { firestoreModule, db } = await getFirestoreModules()
  const snapshot = await firestoreModule.getDoc(profileRef(firestoreModule, db, uid))
  if (!snapshot.exists()) return { status: 'missing', data: null }
  const data = validateUserProfile(snapshot.data())
  return data ? { status: 'ready', data } : { status: 'malformed', data: null }
}

export async function updateUserProfileDisplayName(uid, displayName) {
  assertUid(uid)
  if (import.meta.env.VITE_AUTH_TEST_MODE === 'true') {
    const current = readTestProfile(uid)
    if (!current) throw new Error('cloud/profile-missing')
    return writeTestProfile(uid, { ...current, displayName, updatedAt: new Date().toISOString() })
  }
  const { firestoreModule, db } = await getFirestoreModules()
  await firestoreModule.updateDoc(profileRef(firestoreModule, db, uid), {
    displayName,
    updatedAt: firestoreModule.serverTimestamp(),
  })
  return getUserProfile(uid)
}

export async function syncUserProfileEmail(user) {
  if (!user?.uid) throw new Error('cloud/invalid-user')
  if (import.meta.env.VITE_AUTH_TEST_MODE === 'true') {
    const current = readTestProfile(user.uid)
    if (!current || current.email === (user.email ?? null)) return current
    return writeTestProfile(user.uid, { ...current, email: user.email ?? null, updatedAt: new Date().toISOString() })
  }
  const { firestoreModule, db } = await getFirestoreModules()
  const ref = profileRef(firestoreModule, db, user.uid)
  const snapshot = await firestoreModule.getDoc(ref)
  if (!snapshot.exists() || snapshot.data().email === (user.email ?? null)) return
  await firestoreModule.updateDoc(ref, { email: user.email ?? null, updatedAt: firestoreModule.serverTimestamp() })
}

export async function subscribeUserProfile(uid, onValue, onError) {
  assertUid(uid)
  if (import.meta.env.VITE_AUTH_TEST_MODE === 'true') {
    const key = testProfileKey(uid)
    const emit = () => {
      const data = readTestProfile(uid)
      onValue(data ? { status: 'ready', data } : { status: 'missing', data: null })
    }
    const onCustom = event => { if (event.detail?.uid === uid) emit() }
    const onStorage = event => { if (event.key === key) emit() }
    window.addEventListener('tornado-test-profile-change', onCustom)
    window.addEventListener('storage', onStorage)
    queueMicrotask(emit)
    return () => {
      window.removeEventListener('tornado-test-profile-change', onCustom)
      window.removeEventListener('storage', onStorage)
    }
  }
  const { firestoreModule, db } = await getFirestoreModules()
  return firestoreModule.onSnapshot(profileRef(firestoreModule, db, uid), snapshot => {
    if (!snapshot.exists()) { onValue({ status: 'missing', data: null }); return }
    const data = validateUserProfile(snapshot.data())
    onValue(data ? { status: 'ready', data } : { status: 'malformed', data: null })
  }, onError)
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

export async function setPortableConfigBatch(uid, entries) {
  assertUid(uid)
  const validated = Object.entries(entries).map(([name, value]) => {
    const result = classifyCloudDocument(name, value)
    if (result.status !== 'ready') throw new Error('cloud/invalid-config')
    return [name, result.data]
  })
  const { firestoreModule, db } = await getFirestoreModules()
  const batch = firestoreModule.writeBatch(db)
  for (const [name, value] of validated) batch.set(configRef(firestoreModule, db, uid, name), value)
  await batch.commit()
  return Object.fromEntries(validated)
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
