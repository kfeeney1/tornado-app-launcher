const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:'])

export function parseAllowedExternalUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value)
    return ALLOWED_EXTERNAL_PROTOCOLS.has(url.protocol) ? url : null
  } catch {
    return null
  }
}

export function isAllowedExternalUrl(value) {
  return Boolean(parseAllowedExternalUrl(value))
}
