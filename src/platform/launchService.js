import { platform as defaultPlatform } from './index.js'
import { resolveLaunchTarget } from './launchResolver.js'

export async function launchApp(item, platformApi = defaultPlatform) {
  if (!item || typeof item.id !== 'string') return { ok: false, reason: 'invalid-app' }

  const target = resolveLaunchTarget(item, platformApi.kind)

  if (target.type === 'protocol') {
    const result = await platformApi.launchTarget(target)
    if (result?.ok) return result
    if (target.fallbackUrl) return platformApi.openExternal(target.fallbackUrl)
    return result || { ok: false, reason: 'launch-failed' }
  }

  if (target.url) return platformApi.openExternal(target.url)
  if (target.fallbackUrl) return platformApi.openExternal(target.fallbackUrl)
  return { ok: false, reason: 'no-launch-target' }
}
