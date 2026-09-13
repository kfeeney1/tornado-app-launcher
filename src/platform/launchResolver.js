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

  return {
    appId: item.id,
    type: 'url',
    url: item.url || item.installUrl || item.playStoreUrl || null,
    fallbackUrl: item.url || item.installUrl || item.playStoreUrl || null,
  }
}
