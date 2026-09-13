export function resolveLaunchTarget(item, userAgent = globalThis.navigator?.userAgent ?? '') {
  const isAndroid = /Android/i.test(userAgent)
  const fallbackUrl = isAndroid && item.playStoreUrl
    ? item.playStoreUrl
    : item.installUrl || item.url || null

  if (item.type === 'game' && item.launchUrl) {
    return {
      mode: 'native-with-fallback',
      nativeUrl: item.launchUrl,
      fallbackUrl,
    }
  }

  return {
    mode: 'web',
    nativeUrl: null,
    fallbackUrl: item.url || item.installUrl || item.playStoreUrl || null,
  }
}
