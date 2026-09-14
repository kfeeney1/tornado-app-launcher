import { useEffect, useState } from 'react'
import AppIcon from './AppIcon.jsx'
import { platform, PLATFORM_CAPABILITIES } from '../platform/index.js'
import { resolveLaunchTarget } from '../platform/launchResolver.js'
import { launchApp } from '../platform/launchService.js'
import { isAppInstalled } from '../platform/installedAppsService.js'

export default function LauncherCard({ item, onRemove }) {
  const target = resolveLaunchTarget(item, platform.kind)
  const requiresNativeLaunch = ['protocol', 'installed-app'].includes(target.type)
  const nativeLaunchAvailable = !requiresNativeLaunch || platform.can(PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH)
  const discoveryAvailable = platform.can(PLATFORM_CAPABILITIES.INSTALLED_APP_DISCOVERY)
  const gameResolutionAvailable = item.type === 'game' && platform.can(PLATFORM_CAPABILITIES.GAME_RESOLUTION)
  const [installed, setInstalled] = useState(null)

  useEffect(() => {
    let cancelled = false

    if (gameResolutionAvailable && typeof platform.resolveGame === 'function') {
      void platform.resolveGame(item.id).then(result => {
        if (!cancelled) setInstalled(result?.ok ? result.value.installed : null)
      })
      return () => { cancelled = true }
    }

    if (!discoveryAvailable) return () => { cancelled = true }

    void isAppInstalled(item.id, platform).then(value => {
      if (!cancelled) setInstalled(value)
    })

    return () => { cancelled = true }
  }, [discoveryAvailable, gameResolutionAvailable, item.id])

  const launch = async () => {
    await launchApp(item, platform)
  }

  let status = item.url ? 'Web' : 'Install'
  if (target.type === 'protocol') {
    if ((gameResolutionAvailable || discoveryAvailable) && installed === false) status = 'Install'
    else if ((gameResolutionAvailable || discoveryAvailable) && installed === true) status = 'Launch'
    else status = nativeLaunchAvailable ? 'Launch game' : 'Install'
  } else if (target.type === 'installed-app') {
    if (!nativeLaunchAvailable) status = 'Web'
    else if (installed === true) status = 'Installed · Launch'
    else if (installed === false) status = 'Web'
    else status = 'Checking…'
  } else if (installed === true) {
    status = 'Installed · Web'
  }

  return <article className="launcher-card">
    <button className="launch-target" onClick={launch} aria-label={`Launch ${item.name}`}>
      <AppIcon item={item} />
      <span>{item.name}</span>
      <small>{status}</small>
    </button>
    <button className="remove" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name} from launcher`}>×</button>
  </article>
}
