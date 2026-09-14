import { platform as defaultPlatform, PLATFORM_CAPABILITIES } from './index.js'
import { resolveLaunchTarget } from './launchResolver.js'
import { isAppInstalled } from './installedAppsService.js'
import {
  cacheWindowsResolution,
  getCachedWindowsResolution,
  invalidateWindowsResolution,
} from './windowsLocalState.js'

async function openFallback(target, platformApi) {
  if (target.fallbackUrl) return platformApi.openExternal(target.fallbackUrl)
  return { ok: false, reason: 'no-launch-target' }
}

async function launchInstalledWindowsApp(item, target, platformApi, options) {
  const discoveryAvailable = platformApi.can?.(PLATFORM_CAPABILITIES.INSTALLED_APP_DISCOVERY)
  if (discoveryAvailable) {
    const installed = await isAppInstalled(item.id, platformApi, { storage: options.storage, now: options.now })
    if (!installed) return openFallback(target, platformApi)
  }

  const firstResult = await platformApi.launchTarget(target)
  if (firstResult?.ok) return firstResult

  invalidateWindowsResolution(item.id, options.storage)
  if (discoveryAvailable) {
    const rediscovered = await isAppInstalled(item.id, platformApi, {
      refresh: true,
      storage: options.storage,
      now: options.now ?? Date.now(),
    })
    if (rediscovered) {
      const retryResult = await platformApi.launchTarget(target)
      if (retryResult?.ok) return retryResult
    }
  }

  return openFallback(target, platformApi)
}

async function resolveGame(item, platformApi, options, { useCache = true } = {}) {
  let resolutionValue = useCache && platformApi.kind === 'windows'
    ? getCachedWindowsResolution(item.id, options.storage, options.now ?? Date.now())
    : null

  if (!resolutionValue) {
    const resolution = await platformApi.resolveGame(item.id)
    if (resolution?.ok) {
      resolutionValue = resolution.value
      if (platformApi.kind === 'windows') {
        cacheWindowsResolution(item.id, resolutionValue, options.storage, options.now ?? Date.now(), 'game-resolver')
      }
    }
  }

  return resolutionValue
}

export async function launchApp(item, platformApi = defaultPlatform, options = {}) {
  if (!item || typeof item.id !== 'string') return { ok: false, reason: 'invalid-app' }

  const target = resolveLaunchTarget(item, platformApi.kind)

  if (target.type === 'installed-app') {
    return launchInstalledWindowsApp(item, target, platformApi, options)
  }

  if (target.type === 'protocol') {
    const gameResolutionAvailable = platformApi.can?.(PLATFORM_CAPABILITIES.GAME_RESOLUTION) && typeof platformApi.resolveGame === 'function'
    if (gameResolutionAvailable) {
      const resolutionValue = await resolveGame(item, platformApi, options)
      if (resolutionValue?.installed === false) return openFallback(target, platformApi)
    }

    const result = await platformApi.launchTarget(target)
    if (result?.ok) return result

    if (platformApi.kind === 'windows') invalidateWindowsResolution(item.id, options.storage)

    if (gameResolutionAvailable) {
      const repaired = await resolveGame(item, platformApi, options, { useCache: false })
      if (repaired?.installed === true) {
        const retryResult = await platformApi.launchTarget(target)
        if (retryResult?.ok) return retryResult
      }
    }

    return openFallback(target, platformApi)
  }

  if (target.url) return platformApi.openExternal(target.url)
  if (target.fallbackUrl) return platformApi.openExternal(target.fallbackUrl)
  return { ok: false, reason: 'no-launch-target' }
}
