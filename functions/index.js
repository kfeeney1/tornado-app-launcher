import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

initializeApp()

const RECENT_LOGIN_SECONDS = 5 * 60

export const deleteTornadoAccount = onCall(async request => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in before deleting this Tornado account.')

  const authTime = Number(request.auth?.token?.auth_time || 0)
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (!authTime || nowSeconds - authTime > RECENT_LOGIN_SECONDS) {
    throw new HttpsError('failed-precondition', 'A recent sign-in is required before account deletion.')
  }

  const db = getFirestore()
  const userRef = db.doc(`users/${uid}`)

  try {
    // Delete the complete user-owned Firestore tree while the Auth identity still
    // exists. The operation is retry-safe: an already-empty tree is harmless.
    await db.recursiveDelete(userRef)
  } catch (error) {
    console.error('Account Firestore cleanup failed', { uid, error: error?.message })
    throw new HttpsError('internal', 'Tornado could not delete account data. The authentication account was left intact so deletion can be retried safely.')
  }

  try {
    await getAuth().deleteUser(uid)
  } catch (error) {
    if (error?.code === 'auth/user-not-found') return { deleted: true }
    console.error('Account Auth deletion failed after Firestore cleanup', { uid, error: error?.message })
    throw new HttpsError('internal', 'Cloud data was removed but the authentication account could not be deleted. Retry account deletion to finish the operation.')
  }

  return { deleted: true }
})
