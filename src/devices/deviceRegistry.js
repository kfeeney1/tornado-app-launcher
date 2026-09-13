import { DEVICE_RECORD_SCHEMA_VERSION, normalizeDeviceRecord, sortDevices, toDate } from './deviceTypes.js'

const firebaseVersion = '11.10.0'
const appModuleUrl = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`
const firestoreModuleUrl = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-firestore.js`
const LAST_SEEN_WRITE_INTERVAL_MS = 15 * 60 * 1000
const recentWrites = new Map()
let firestorePromise = null

async function getFirestoreModules() {
  if (!firestorePromise) {
    firestorePromise = Promise.all([
      import(/* @vite-ignore */ appModuleUrl),
      import(/* @vite-ignore */ firestoreModuleUrl),
    ]).then(([appModule, firestoreModule]) => {
      if (!appModule.getApps().length) throw new Error('devices/firebase-not-initialized')
      return { firestoreModule, db: firestoreModule.getFirestore(appModule.getApp()) }
    })
  }
  return firestorePromise
}

function assertUid(uid) {
  if (!uid || typeof uid !== 'string') throw new Error('devices/invalid-user')
}

function deviceRef(firestoreModule, db, uid, deviceId) {
  return firestoreModule.doc(db, 'users', uid, 'devices', deviceId)
}

function devicesRef(firestoreModule, db, uid) {
  return firestoreModule.collection(db, 'users', uid, 'devices')
}

function testKey(uid) { return `tornado-test-devices-v1:${uid}` }

function readTestDevices(uid) {
  try {
    const parsed = JSON.parse(localStorage.getItem(testKey(uid)) || '[]')
    return Array.isArray(parsed) ? parsed.map(record => normalizeDeviceRecord(record)).filter(Boolean) : []
  } catch { return [] }
}

function writeTestDevices(uid, devices) {
  if (navigator.onLine === false) throw new Error('devices/offline')
  localStorage.setItem(testKey(uid), JSON.stringify(devices))
}

function createTestBackend() {
  return {
    async register(uid, deviceId, metadata, now = new Date()) {
      const devices = readTestDevices(uid)
      const existing = devices.find(record => record.deviceId === deviceId)
      const record = normalizeDeviceRecord({
        schemaVersion: DEVICE_RECORD_SCHEMA_VERSION,
        deviceId,
        ...metadata,
        createdAt: existing?.createdAt ?? now.toISOString(),
        lastSeenAt: now.toISOString(),
      })
      if (!record) throw new Error('devices/invalid-record')
      writeTestDevices(uid, [...devices.filter(item => item.deviceId !== deviceId), record])
      return record
    },
    async list(uid) { return readTestDevices(uid) },
    async remove(uid, deviceId) { writeTestDevices(uid, readTestDevices(uid).filter(record => record.deviceId !== deviceId)) },
  }
}

function createFirestoreBackend() {
  return {
    async register(uid, deviceId, metadata) {
      const { firestoreModule, db } = await getFirestoreModules()
      const ref = deviceRef(firestoreModule, db, uid, deviceId)
      await firestoreModule.runTransaction(db, async transaction => {
        const snapshot = await transaction.get(ref)
        const existing = snapshot.exists() ? snapshot.data() : null
        transaction.set(ref, {
          schemaVersion: DEVICE_RECORD_SCHEMA_VERSION,
          deviceId,
          ...metadata,
          createdAt: existing?.createdAt ?? firestoreModule.serverTimestamp(),
          lastSeenAt: firestoreModule.serverTimestamp(),
        })
      })
      const snapshot = await firestoreModule.getDoc(ref)
      return normalizeDeviceRecord(snapshot.data(), snapshot.id)
    },
    async list(uid) {
      const { firestoreModule, db } = await getFirestoreModules()
      const snapshot = await firestoreModule.getDocs(devicesRef(firestoreModule, db, uid))
      return snapshot.docs.map(doc => normalizeDeviceRecord(doc.data(), doc.id)).filter(Boolean)
    },
    async remove(uid, deviceId) {
      const { firestoreModule, db } = await getFirestoreModules()
      await firestoreModule.deleteDoc(deviceRef(firestoreModule, db, uid, deviceId))
    },
  }
}

export function createDeviceRegistryService({ backend } = {}) {
  const registryBackend = backend ?? (import.meta.env.VITE_AUTH_TEST_MODE === 'true' ? createTestBackend() : createFirestoreBackend())
  return {
    async registerCurrentDevice(uid, deviceId, metadata, { force = false, now = new Date() } = {}) {
      assertUid(uid)
      const throttleKey = `${uid}:${deviceId}`
      const previous = recentWrites.get(throttleKey)
      if (!force && previous && now.getTime() - previous < LAST_SEEN_WRITE_INTERVAL_MS) return null
      const record = await registryBackend.register(uid, deviceId, metadata, now)
      recentWrites.set(throttleKey, now.getTime())
      return record
    },
    async listDevices(uid, currentDeviceId) {
      assertUid(uid)
      return sortDevices((await registryBackend.list(uid)).filter(Boolean), currentDeviceId)
    },
    async removeDevice(uid, deviceId) {
      assertUid(uid)
      await registryBackend.remove(uid, deviceId)
      recentWrites.delete(`${uid}:${deviceId}`)
    },
  }
}

export function shouldRefreshLastSeen(lastSeenAt, now = new Date()) {
  const previous = toDate(lastSeenAt)
  return !previous || now.getTime() - previous.getTime() >= LAST_SEEN_WRITE_INTERVAL_MS
}

export { LAST_SEEN_WRITE_INTERVAL_MS }
