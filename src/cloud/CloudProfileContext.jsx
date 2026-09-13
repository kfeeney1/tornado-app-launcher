import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { describeCloudError, ensureUserProfile, subscribeUserProfile, syncUserProfileEmail, updateUserProfileDisplayName } from './cloudProfile.js'

const CloudProfileContext = createContext(null)

export function CloudProfileProvider({ children }) {
  const { user, updateAuthDisplayName } = useAuth()
  const [state, setState] = useState({ status: 'preparing', message: '', profile: null })

  useEffect(() => {
    let active = true
    let unsubscribe = () => {}

    const initialise = async () => {
      try {
        const result = await ensureUserProfile(user)
        if (!active) return
        if (result.status !== 'ready') {
          setState({ status: result.status, message: 'Cloud profile needs attention', profile: null })
          return
        }
        setState({ status: 'ready', message: 'Cloud profile ready', profile: result.data })
        await syncUserProfileEmail(user)
        unsubscribe = await subscribeUserProfile(user.uid, next => {
          if (!active) return
          if (next.status === 'ready') setState({ status: 'ready', message: 'Cloud profile ready', profile: next.data })
          else setState({ status: next.status, message: 'Cloud profile needs attention', profile: null })
        }, error => {
          if (!active) return
          setState(current => ({ ...current, status: 'unavailable', message: describeCloudError(error) }))
        })
      } catch (error) {
        if (!active) return
        setState({ status: 'unavailable', message: describeCloudError(error), profile: null })
      }
    }

    initialise()
    return () => {
      active = false
      unsubscribe()
    }
  }, [user?.uid, user?.email])

  const updateDisplayName = useCallback(async displayName => {
    if (!user?.uid) throw new Error('Your Tornado account is no longer available.')
    await updateUserProfileDisplayName(user.uid, displayName)
    await updateAuthDisplayName(displayName)
  }, [user?.uid, updateAuthDisplayName])

  const value = useMemo(() => ({ ...state, updateDisplayName }), [state, updateDisplayName])
  return <CloudProfileContext.Provider value={value}>{children}</CloudProfileContext.Provider>
}

export function useCloudProfile() {
  const value = useContext(CloudProfileContext)
  if (!value) throw new Error('useCloudProfile must be used inside CloudProfileProvider')
  return value
}
