import { getApp, getApps, initializeApp } from 'firebase/app'

const REQUIRED_FIREBASE_FIELDS = ['apiKey', 'projectId', 'appId']

export function firebaseConfigFromEnv(env = import.meta.env) {
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  }
}

export function validateFirebaseConfig(config) {
  const missing = REQUIRED_FIREBASE_FIELDS.filter(field => !config?.[field]?.trim?.())
  if (missing.length) {
    const error = new Error(`firebase/configuration-missing:${missing.join(',')}`)
    error.code = 'firebase/configuration-missing'
    error.missingFields = missing
    throw error
  }
  return config
}

export function resolveFirebaseConfig(env = import.meta.env) {
  return validateFirebaseConfig(firebaseConfigFromEnv(env))
}

export function getFirebaseClientApp() {
  if (getApps().length) return getApp()
  return initializeApp(resolveFirebaseConfig())
}
