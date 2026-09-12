import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { describeCloudError, ensureUserProfile } from './cloudProfile.js'

const CloudProfileContext = createContext(null)

export function CloudProfileProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'idle', message: '' })

  useEffect(() => {
    let active = true
    if (!user) {
      setState({ status: 'idle', message: '' })
      return () => { active = false }
    }

    setState({ status: 'preparing', message: '' })
    ensureUserProfile(user)
      .then(result => {
        if (!active) return
        if (result.status === 'ready') setState({ status: 'ready', message: 'Cloud profile ready' })
        else setState({ status: result.status, message: 'Cloud profile needs attention' })
      })
      .catch(error => {
        if (!active) return
        setState({ status: 'unavailable', message: describeCloudError(error) })
      })

    return () => { active = false }
  }, [user])

  const value = useMemo(() => state, [state])
  return <CloudProfileContext.Provider value={value}>{children}</CloudProfileContext.Provider>
}

export function useCloudProfile() {
  const value = useContext(CloudProfileContext)
  if (!value) throw new Error('useCloudProfile must be used inside CloudProfileProvider')
  return value
}
