import { useEffect, useState } from 'react'
import AppIcon from './AppIcon.jsx'
import { platform, PLATFORM_CAPABILITIES } from '../platform/index.js'
import { resolveLaunchTarget } from '../platform/launchResolver.js'
import { launchApp } from '../platform/launchService.js'
import { isAppInstalled } from '../platform/installedAppsService.js'

export default function LauncherCard({ item, onRemove }) {
  const target = resolveLaunchTarget(item, platform.kind)
  const nativeLaunchAvailable = target.type !== 'protocol' || platform.can(PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH)
  const discoveryAvailable = platform.can(PLATFORM_CAPABILITIES.INSTALLED_APP_DISCOVERY)
  const [installed, setInstalled] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!discoveryAvailable) return () => { cancelled = true }

    void isAppInstalled(item.id, platform).then(value => {
      if (!cancelled) setInstalled(value)
    })

    return () => { cancelled = true }
  }, [discoveryAvailable, item.id])

  const launch = async () => {
    await launchApp(item, platform)
  }

  let status = item.url ? 'Web' : 'Install'
  if (target.type === 'protocol') {
    if (discoveryAvailable && installed === false) status = 'Install'
    else if (discoveryAvailable && installed === true) status = 'Launch'
    else status = nativeLaunchAvailable ? 'Launch game' : 'Install'
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
