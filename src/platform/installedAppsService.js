import { platform as defaultPlatform, PLATFORM_CAPABILITIES } from './index.js'

let cachedPlatform = null
let cachedPromise = null

export async function getInstalledApps(platformApi = defaultPlatform, { refresh = false } = {}) {
  if (!platformApi?.can?.(PLATFORM_CAPABILITIES.INSTALLED_APP_DISCOVERY) || typeof platformApi.getInstalledApps !== 'function') {
    return []
  }

  if (refresh || cachedPlatform !== platformApi || !cachedPromise) {
    cachedPlatform = platformApi
    cachedPromise = Promise.resolve(platformApi.getInstalledApps())
      .then(result => result?.ok && Array.isArray(result.value) ? result.value : [])
      .catch(() => [])
  }

  return cachedPromise
}

export async function isAppInstalled(appId, platformApi = defaultPlatform) {
  if (typeof appId !== 'string' || !appId) return false
  const apps = await getInstalledApps(platformApi)
  return apps.some(app => app?.appId === appId)
}

export function clearInstalledAppsCache() {
  cachedPlatform = null
  cachedPromise = null
}
