import { useEffect } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { isAndroid } from './index.js'

export default function AndroidLifecycleBoundary() {
  useEffect(() => {
    if (!isAndroid()) return undefined

    let active = true
    const handles = []

    const register = async () => {
      handles.push(await CapacitorApp.addListener('backButton', () => {
        const state = window.history.state
        if (state?.tornadoSession && state?.tornadoView && state.tornadoView !== 'home') {
          window.history.back()
          return
        }
        if (window.confirm('Exit Tornado?')) CapacitorApp.exitApp()
      }))

      handles.push(await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (!active || !isActive) return
        window.dispatchEvent(new CustomEvent('tornado-app-resumed'))
      }))
    }

    register().catch(() => {})
    return () => {
      active = false
      for (const handle of handles) handle.remove().catch(() => {})
    }
  }, [])

  return null
}
