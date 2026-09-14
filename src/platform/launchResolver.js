const WINDOWS_NATIVE_APP_IDS = new Set(['spotify', 'discord', 'notion'])

export function resolveLaunchTarget(item, platformKind = 'web') {
  const fallbackUrl = platformKind === 'android' && item.playStoreUrl
    ? item.playStoreUrl
    : item.installUrl || item.url || null

  if (item.type === 'game' && item.launchUrl) {
    return {
      appId: item.id,
      type: 'protocol',
      protocol: item.launchUrl,
      fallbackUrl,
    }
  }

  if (platformKind === 'windows' && item.type === 'app' && WINDOWS_NATIVE_APP_IDS.has(item.id)) {
    return {
      appId: item.id,
      type: 'installed-app',
      fallbackUrl: item.url || item.installUrl || null,
    }
  }

  return {
    appId: item.id,
    type: 'url',
    url: item.url || item.installUrl || item.playStoreUrl || null,
    fallbackUrl: item.url || item.installUrl || item.playStoreUrl || null,
  }
}
