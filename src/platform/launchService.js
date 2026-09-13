import { platform as defaultPlatform, PLATFORM_CAPABILITIES } from './index.js'
import { resolveLaunchTarget } from './launchResolver.js'

async function openFallback(target, platformApi) {
  if (target.fallbackUrl) return platformApi.openExternal(target.fallbackUrl)
  return { ok: false, reason: 'no-launch-target' }
}

export async function launchApp(item, platformApi = defaultPlatform) {
  if (!item || typeof item.id !== 'string') return { ok: false, reason: 'invalid-app' }

  const target = resolveLaunchTarget(item, platformApi.kind)

  if (target.type === 'protocol') {
    if (platformApi.can?.(PLATFORM_CAPABILITIES.GAME_RESOLUTION) && typeof platformApi.resolveGame === 'function') {
      const resolution = await platformApi.resolveGame(item.id)
      if (resolution?.ok && resolution.value.installed === false) return openFallback(target, platformApi)
    }

    const result = await platformApi.launchTarget(target)
    if (result?.ok) return result
    if (target.fallbackUrl) return platformApi.openExternal(target.fallbackUrl)
    return result || { ok: false, reason: 'launch-failed' }
  }

  if (target.url) return platformApi.openExternal(target.url)
  if (target.fallbackUrl) return platformApi.openExternal(target.fallbackUrl)
  return { ok: false, reason: 'no-launch-target' }
}
