import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearAccountOwnedLocalData } from '../account/accountLocalData.js'

const AuthContext = createContext(null)
const TEST_SESSION_KEY = 'tornado-test-auth-session'
const TEST_ACCOUNTS_KEY = 'tornado-test-auth-accounts-v2'
const TEST_ACCOUNT = { uid: 'test-existing@tornado.test', email: 'existing@tornado.test', password: 'Tornado123!', displayName: 'Tornado Player', emailVerified: false, providerIds: ['password'] }

const firebaseVersion = '11.10.0'
const appModuleUrl = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`
const authModuleUrl = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth.js`
const functionsModuleUrl = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-functions.js`

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
  const code = error?.code || error?.cause?.code || error?.message || ''

  if (code.includes('invalid-email')) return 'Please enter a valid email address.'
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'The current password is incorrect.'
  if (code.includes('user-not-found')) return 'This Tornado account is no longer available.'
  if (code.includes('user-disabled')) return 'This Tornado account has been disabled.'
  if (code.includes('weak-password')) return 'Choose a stronger password with at least 8 characters.'
  if (code.includes('email-already-in-use')) return 'An account already exists for that email address.'
  if (code.includes('requires-recent-login') || code.includes('credential-too-old-login-again')) return 'Please confirm your password again before changing this account.'
  if (code.includes('operation-not-allowed') || code.includes('provider-mismatch')) return 'That account action is not available for this sign-in method.'
  if (code.includes('network-request-failed') || code.includes('unavailable')) return 'Unable to connect. Check your network and try again.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Please try again later.'
  if (code.includes('configuration-missing')) return 'Tornado sign-in is not configured on this build.'
  if (code.includes('functions/not-found')) return 'Account deletion is not available on this deployment yet.'
  if (code.includes('functions/failed-precondition')) return 'Please confirm your password again before deleting this account.'

  return 'Unable to complete that request right now. Please try again.'
}

function authError(code) {
  const error = new Error(code)
  error.code = code
  return error
}

function readTestAccounts() {
  try {
    const stored = JSON.parse(localStorage.getItem(TEST_ACCOUNTS_KEY) || 'null')
    const accounts = Array.isArray(stored) ? stored : []
    if (!accounts.some(account => account.uid === TEST_ACCOUNT.uid)) accounts.push({ ...TEST_ACCOUNT })
    localStorage.setItem(TEST_ACCOUNTS_KEY, JSON.stringify(accounts))
    return accounts
  } catch {
    return [{ ...TEST_ACCOUNT }]
  }
}

function writeTestAccounts(accounts) {
  localStorage.setItem(TEST_ACCOUNTS_KEY, JSON.stringify(accounts))
}

function publicTestUser(account) {
  return account ? {
    uid: account.uid,
    email: account.email,
    displayName: account.displayName ?? null,
    emailVerified: account.emailVerified === true,
    providerIds: Array.isArray(account.providerIds) ? account.providerIds : ['password'],
  } : null
}

function createTestAdapter() {
  let listener = null
  const findSession = () => {
    const uid = localStorage.getItem(TEST_SESSION_KEY)
    return readTestAccounts().find(account => account.uid === uid) ?? null
  }
  const publish = account => listener?.(publicTestUser(account))
  const updateAccount = (uid, updater) => {
    const accounts = readTestAccounts()
    const index = accounts.findIndex(account => account.uid === uid)
    if (index < 0) throw authError('auth/user-not-found')
    accounts[index] = updater({ ...accounts[index] })
    writeTestAccounts(accounts)
    if (localStorage.getItem(TEST_SESSION_KEY) === uid) publish(accounts[index])
    return accounts[index]
  }
  const current = () => {
    const account = findSession()
    if (!account) throw authError('auth/user-not-found')
    return account
  }
  const verifyPassword = password => {
    const account = current()
    if (!account.providerIds?.includes('password')) throw authError('auth/provider-mismatch')
    if (account.password !== password) throw authError('auth/invalid-credential')
    return account
  }

  return {
    subscribe(next) {
      listener = next
      queueMicrotask(() => next(publicTestUser(findSession())))
      return () => { listener = null }
    },
    async signIn(email, password) {
      const account = readTestAccounts().find(item => item.email.toLowerCase() === email.toLowerCase())
      if (!account || account.password !== password) throw authError('auth/invalid-credential')
      localStorage.setItem(TEST_SESSION_KEY, account.uid)
      publish(account)
      return publicTestUser(account)
    },
    async signUp(email, password) {
      const accounts = readTestAccounts()
      if (accounts.some(account => account.email.toLowerCase() === email.toLowerCase())) throw authError('auth/email-already-in-use')
      const account = { uid: `test-${email.toLowerCase()}`, email: email.toLowerCase(), password, displayName: null, emailVerified: false, providerIds: ['password'] }
      accounts.push(account)
      writeTestAccounts(accounts)
      localStorage.setItem(TEST_SESSION_KEY, account.uid)
      publish(account)
      return publicTestUser(account)
    },
    async signOut() {
      localStorage.removeItem(TEST_SESSION_KEY)
      publish(null)
    },
    async resetPassword() {},
    async refreshUser() { return publicTestUser(current()) },
    async updateDisplayName(displayName) {
      const account = updateAccount(current().uid, value => ({ ...value, displayName }))
      return publicTestUser(account)
    },
    async sendVerificationEmail() {},
    async reauthenticate(password) { verifyPassword(password) },
    async requestEmailChange(password, newEmail) {
      const account = verifyPassword(password)
      if (readTestAccounts().some(item => item.uid !== account.uid && item.email.toLowerCase() === newEmail.toLowerCase())) throw authError('auth/email-already-in-use')
      updateAccount(account.uid, value => ({ ...value, pendingEmail: newEmail.toLowerCase() }))
    },
    async changePassword(currentPassword, newPassword) {
      const account = verifyPassword(currentPassword)
      updateAccount(account.uid, value => ({ ...value, password: newPassword }))
      return publicTestUser(current())
    },
    async deleteAccount(currentPassword) {
      const account = verifyPassword(currentPassword)
      writeTestAccounts(readTestAccounts().filter(item => item.uid !== account.uid))
      localStorage.removeItem(TEST_SESSION_KEY)
      publish(null)
    },
  }
}

function snapshotFirebaseUser(user) {
  return user ? {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    providerIds: [...new Set((user.providerData || []).map(provider => provider.providerId).filter(Boolean))],
  } : null
}

async function createFirebaseAdapter() {
  const [appModule, authModule, functionsModule, config] = await Promise.all([
    import(/* @vite-ignore */ appModuleUrl),
    import(/* @vite-ignore */ authModuleUrl),
    import(/* @vite-ignore */ functionsModuleUrl),
    resolveFirebaseConfig(),
  ])

  const app = appModule.getApps().length ? appModule.getApp() : appModule.initializeApp(config)
  const auth = authModule.getAuth(app)
  await authModule.setPersistence(auth, authModule.browserLocalPersistence)

  const emulatorUrl = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL
  if (emulatorUrl) authModule.connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true })

  const functions = functionsModule.getFunctions(app)
  const functionsEmulator = import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_URL
  if (functionsEmulator) {
    const url = new URL(functionsEmulator)
    functionsModule.connectFunctionsEmulator(functions, url.hostname, Number(url.port || 5001))
  }

  const currentUser = () => {
    if (!auth.currentUser) throw authError('auth/user-not-found')
    return auth.currentUser
  }
  const reauthenticate = async password => {
    const firebaseUser = currentUser()
    if (!(firebaseUser.providerData || []).some(provider => provider.providerId === 'password') || !firebaseUser.email) throw authError('auth/provider-mismatch')
    const credential = authModule.EmailAuthProvider.credential(firebaseUser.email, password)
    await authModule.reauthenticateWithCredential(firebaseUser, credential)
  }

  return {
    subscribe: next => authModule.onAuthStateChanged(auth, user => next(snapshotFirebaseUser(user))),
    async signIn(email, password) {
      const credential = await authModule.signInWithEmailAndPassword(auth, email, password)
      return snapshotFirebaseUser(credential.user)
    },
    async signUp(email, password) {
      const credential = await authModule.createUserWithEmailAndPassword(auth, email, password)
      return snapshotFirebaseUser(credential.user)
    },
    signOut: () => authModule.signOut(auth),
    resetPassword: email => authModule.sendPasswordResetEmail(auth, email),
    async refreshUser() {
      const firebaseUser = currentUser()
      await authModule.reload(firebaseUser)
      return snapshotFirebaseUser(auth.currentUser)
    },
    async updateDisplayName(displayName) {
      const firebaseUser = currentUser()
      await authModule.updateProfile(firebaseUser, { displayName })
      await authModule.reload(firebaseUser)
      return snapshotFirebaseUser(auth.currentUser)
    },
    sendVerificationEmail: () => authModule.sendEmailVerification(currentUser()),
    reauthenticate,
    async requestEmailChange(password, newEmail) {
      await reauthenticate(password)
      await authModule.verifyBeforeUpdateEmail(currentUser(), newEmail)
    },
    async changePassword(currentPassword, newPassword) {
      await reauthenticate(currentPassword)
      await authModule.updatePassword(currentUser(), newPassword)
      return snapshotFirebaseUser(auth.currentUser)
    },
    async deleteAccount(currentPassword) {
      await reauthenticate(currentPassword)
      const callDelete = functionsModule.httpsCallable(functions, 'deleteTornadoAccount')
      await callDelete()
      try { await authModule.signOut(auth) } catch { /* server already deleted the account */ }
    },
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
        const nextAdapter = import.meta.env.VITE_AUTH_TEST_MODE === 'true' ? createTestAdapter() : await createFirebaseAdapter()
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

  const runAndRefresh = useCallback(async operation => {
    const result = await run(operation)
    if (result) setUser(result)
    return result
  }, [run])

  const deleteAccount = useCallback(async currentPassword => {
    const uid = user?.uid
    if (!uid) throw new Error('This Tornado account is no longer available.')
    await run(auth => auth.deleteAccount(currentPassword))
    clearAccountOwnedLocalData(uid)
    setUser(null)
  }, [run, user?.uid])

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    initializationError,
    signIn: (email, password) => runAndRefresh(auth => auth.signIn(email, password)),
    signUp: (email, password) => runAndRefresh(auth => auth.signUp(email, password)),
    signOut: () => run(auth => auth.signOut()),
    resetPassword: email => run(auth => auth.resetPassword(email)),
    refreshUser: () => runAndRefresh(auth => auth.refreshUser()),
    updateAuthDisplayName: displayName => runAndRefresh(auth => auth.updateDisplayName(displayName)),
    sendVerificationEmail: () => run(auth => auth.sendVerificationEmail()),
    reauthenticate: password => run(auth => auth.reauthenticate(password)),
    requestEmailChange: (password, email) => run(auth => auth.requestEmailChange(password, email)),
    changePassword: (currentPassword, newPassword) => runAndRefresh(auth => auth.changePassword(currentPassword, newPassword)),
    deleteAccount,
  }), [user, isLoading, initializationError, run, runAndRefresh, deleteAccount])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
