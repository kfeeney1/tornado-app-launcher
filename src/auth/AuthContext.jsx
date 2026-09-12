import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const TEST_SESSION_KEY = 'tornado-test-auth-session'
const TEST_ACCOUNT = { email: 'existing@tornado.test', password: 'Tornado123!' }

const firebaseVersion = '11.10.0'
const appModuleUrl = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`
const authModuleUrl = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth.js`

const firebaseConfigFromEnv = () => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  }

  return config.apiKey && config.projectId && config.appId ? config : null
}

async function resolveFirebaseConfig() {
  const envConfig = firebaseConfigFromEnv()
  if (envConfig) return envConfig

  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    const response = await fetch('/__/firebase/init.json', { cache: 'no-store' })
    if (response.ok) return response.json()
  }

  throw new Error('firebase/configuration-missing')
}

function mapAuthError(error) {
  const code = error?.code || error?.message || ''

  if (code.includes('invalid-email')) return 'Please enter a valid email address.'
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Incorrect email or password.'
  }
  if (code.includes('weak-password')) return 'Choose a stronger password with at least 8 characters.'
  if (code.includes('email-already-in-use')) return 'An account already exists for that email address.'
  if (code.includes('network-request-failed')) return 'Unable to connect. Check your network and try again.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Please try again later.'
  if (code.includes('configuration-missing')) return 'Tornado sign-in is not configured on this build.'

  return 'Unable to complete that request right now. Please try again.'
}

function authError(code) {
  const error = new Error(code)
  error.code = code
  return error
}

function createTestAdapter() {
  let listener = null
  const readSession = () => {
    const email = localStorage.getItem(TEST_SESSION_KEY)
    return email ? { uid: `test-${email}`, email } : null
  }
  const publish = user => listener?.(user)

  return {
    subscribe(next) {
      listener = next
      queueMicrotask(() => next(readSession()))
      return () => { listener = null }
    },
    async signIn(email, password) {
      if (email.toLowerCase() !== TEST_ACCOUNT.email || password !== TEST_ACCOUNT.password) {
        throw authError('auth/invalid-credential')
      }
      localStorage.setItem(TEST_SESSION_KEY, email.toLowerCase())
      publish(readSession())
    },
    async signUp(email) {
      localStorage.setItem(TEST_SESSION_KEY, email.toLowerCase())
      publish(readSession())
    },
    async signOut() {
      localStorage.removeItem(TEST_SESSION_KEY)
      publish(null)
    },
    async resetPassword() {},
  }
}

async function createFirebaseAdapter() {
  const [appModule, authModule, config] = await Promise.all([
    import(/* @vite-ignore */ appModuleUrl),
    import(/* @vite-ignore */ authModuleUrl),
    resolveFirebaseConfig(),
  ])

  const app = appModule.getApps().length ? appModule.getApp() : appModule.initializeApp(config)
  const auth = authModule.getAuth(app)
  await authModule.setPersistence(auth, authModule.browserLocalPersistence)

  const emulatorUrl = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL
  if (emulatorUrl) {
    authModule.connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true })
  }

  return {
    subscribe: next => authModule.onAuthStateChanged(auth, next),
    signIn: (email, password) => authModule.signInWithEmailAndPassword(auth, email, password),
    signUp: (email, password) => authModule.createUserWithEmailAndPassword(auth, email, password),
    signOut: () => authModule.signOut(auth),
    resetPassword: email => authModule.sendPasswordResetEmail(auth, email),
  }
}

export function AuthProvider({ children }) {
  const [adapter, setAdapter] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initializationError, setInitializationError] = useState('')

  useEffect(() => {
    let active = true
    let unsubscribe = () => {}

    const initialise = async () => {
      try {
        const nextAdapter = import.meta.env.VITE_AUTH_TEST_MODE === 'true'
          ? createTestAdapter()
          : await createFirebaseAdapter()
        if (!active) return
        setAdapter(nextAdapter)
        unsubscribe = nextAdapter.subscribe(nextUser => {
          if (!active) return
          setUser(nextUser)
          setIsLoading(false)
        })
      } catch (error) {
        if (!active) return
        setInitializationError(mapAuthError(error))
        setIsLoading(false)
      }
    }

    initialise()
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const run = useCallback(async operation => {
    if (!adapter) throw new Error(initializationError || 'Tornado sign-in is still loading.')
    try {
      return await operation(adapter)
    } catch (error) {
      throw new Error(mapAuthError(error), { cause: error })
    }
  }, [adapter, initializationError])

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    initializationError,
    signIn: (email, password) => run(auth => auth.signIn(email, password)),
    signUp: (email, password) => run(auth => auth.signUp(email, password)),
    signOut: () => run(auth => auth.signOut()),
    resetPassword: email => run(auth => auth.resetPassword(email)),
  }), [user, isLoading, initializationError, run])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
