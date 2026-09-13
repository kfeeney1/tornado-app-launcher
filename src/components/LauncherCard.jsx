import AppIcon from './AppIcon.jsx'
import { platform, PLATFORM_CAPABILITIES } from '../platform/index.js'
import { resolveLaunchTarget } from '../platform/launchResolver.js'

export default function LauncherCard({ item, onRemove }) {
  const target = resolveLaunchTarget(item, platform.kind)
  const nativeLaunchAvailable = target.type !== 'protocol' || platform.can(PLATFORM_CAPABILITIES.NATIVE_APP_LAUNCH)

  const launch = async () => {
    if (target.type === 'protocol' && nativeLaunchAvailable) {
      const result = await platform.launchTarget(target)
      if (result?.ok) return
    }

    if (target.fallbackUrl) await platform.openExternal(target.fallbackUrl)
  }

  return <article className="launcher-card">
    <button className="launch-target" onClick={launch} aria-label={`Launch ${item.name}`}>
      <AppIcon item={item} />
      <span>{item.name}</span>
      <small>{target.type === 'protocol' && nativeLaunchAvailable ? 'Launch game' : item.url ? 'Web' : 'Install'}</small>
    </button>
    <button className="remove" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name} from launcher`}>×</button>
  </article>
}
