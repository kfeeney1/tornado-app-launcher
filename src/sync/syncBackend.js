import {
  getAppearanceConfig,
  getLauncherConfig,
  getPreferences,
  setAppearanceConfig,
  setLauncherConfig,
  setPreferences,
  subscribeAppearanceConfig,
  subscribeLauncherConfig,
  subscribePreferences,
} from '../cloud/cloudProfile.js'
import { classifyCloudDocument } from '../cloud/schema.js'

const TEST_PREFIX = 'tornado-test-cloud-v1:'
const testKey = (uid, domain) => `${TEST_PREFIX}${uid}:${domain}`

function testRead(uid, domain) {
  try {
    const raw = localStorage.getItem(testKey(uid, domain))
    return raw == null ? { status: 'missing', data: null } : classifyCloudDocument(domain, JSON.parse(raw))
  } catch { return { status: 'malformed', data: null } }
}

function testWrite(uid, domain, data) {
  localStorage.setItem(testKey(uid, domain), JSON.stringify(data))
  window.dispatchEvent(new CustomEvent('tornado-test-cloud-change', { detail: { uid, domain } }))
}

function testSubscribe(uid, domain, next) {
  const key = testKey(uid, domain)
  const onCustom = event => {
    if (event.detail?.uid === uid && event.detail?.domain === domain) next(testRead(uid, domain))
  }
  const onStorage = event => {
    if (event.key === key) next(testRead(uid, domain))
  }
  window.addEventListener('tornado-test-cloud-change', onCustom)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener('tornado-test-cloud-change', onCustom)
    window.removeEventListener('storage', onStorage)
  }
}

export function createSyncBackend() {
  if (import.meta.env.VITE_AUTH_TEST_MODE === 'true') {
    return {
      read: async (uid, domain) => testRead(uid, domain),
      write: async (uid, domain, data) => testWrite(uid, domain, data),
      subscribe: async (uid, domain, next) => testSubscribe(uid, domain, next),
    }
  }

  const readers = { appearance: getAppearanceConfig, launcher: getLauncherConfig, preferences: getPreferences }
  const writers = { appearance: setAppearanceConfig, launcher: setLauncherConfig, preferences: setPreferences }
  const subscribers = { appearance: subscribeAppearanceConfig, launcher: subscribeLauncherConfig, preferences: subscribePreferences }
  return {
    read: (uid, domain) => readers[domain](uid),
    write: (uid, domain, data) => writers[domain](uid, data),
    subscribe: (uid, domain, next, error) => subscribers[domain](uid, next, error),
  }
}
