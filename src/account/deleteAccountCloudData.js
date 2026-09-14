const firebaseVersion = '11.10.0'
const appModuleUrl = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`
const authModuleUrl = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth.js`
const firestoreModuleUrl = `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-firestore.js`

const CONFIG_DOCUMENTS = ['appearance', 'launcher', 'preferences']
const RECENT_LOGIN_MS = 5 * 60 * 1000
const BATCH_LIMIT = 400

function recentLoginError() {
  const error = new Error('auth/requires-recent-login')
  error.code = 'auth/requires-recent-login'
  return error
}

async function assertRecentLogin(authModule, firebaseUser) {
  const token = await authModule.getIdTokenResult(firebaseUser, true)
  const authTime = Date.parse(token.authTime || '')
  if (!Number.isFinite(authTime) || Date.now() - authTime > RECENT_LOGIN_MS) throw recentLoginError()
}

/**
 * Deletes the complete Tornado cloud-data shape currently owned by a user, then
 * deletes the Firebase Authentication identity. Firestore cleanup happens first
 * so a failed data deletion never strands private data behind a deleted login.
 *
 * This intentionally knows the complete current user tree: users/{uid}, its
 * config documents and its devices collection. Any future user-owned
 * subcollection must be added here and covered by Firestore rules tests.
 */
export async function deleteFirebaseAccount(firebaseUser) {
  if (!firebaseUser?.uid) throw new Error('auth/user-not-found')

  const [appModule, authModule, firestoreModule] = await Promise.all([
    import(/* @vite-ignore */ appModuleUrl),
    import(/* @vite-ignore */ authModuleUrl),
    import(/* @vite-ignore */ firestoreModuleUrl),
  ])

  await assertRecentLogin(authModule, firebaseUser)

  if (!appModule.getApps().length) throw new Error('firebase/configuration-missing')
  const db = firestoreModule.getFirestore(appModule.getApp())
  const uid = firebaseUser.uid

  const deviceSnapshot = await firestoreModule.getDocs(
    firestoreModule.collection(db, 'users', uid, 'devices'),
  )

  const refs = [
    ...deviceSnapshot.docs.map(snapshot => snapshot.ref),
    ...CONFIG_DOCUMENTS.map(name => firestoreModule.doc(db, 'users', uid, 'config', name)),
    firestoreModule.doc(db, 'users', uid),
  ]

  for (let index = 0; index < refs.length; index += BATCH_LIMIT) {
    const batch = firestoreModule.writeBatch(db)
    for (const ref of refs.slice(index, index + BATCH_LIMIT)) batch.delete(ref)
    await batch.commit()
  }

  await authModule.deleteUser(firebaseUser)
}
