import { validatePortableConfig } from '../config/localConfig.js'

export const DOMAINS = ['appearance', 'launcher', 'preferences']

export function toDomain(portable, domain) {
  const value = validatePortableConfig(portable)
  if (!value) throw new Error('sync/invalid-local-config')
  if (domain === 'appearance') return { schemaVersion: 1, theme: value.appearance.theme }
  if (domain === 'launcher') return { schemaVersion: 1, selectedItemIds: [...value.launcher.selectedItemIds] }
  if (domain === 'preferences') return { schemaVersion: 1 }
  throw new Error('sync/unknown-domain')
}

export function applyDomain(portable, domain, cloud) {
  const value = validatePortableConfig(portable)
  if (!value) throw new Error('sync/invalid-local-config')
  if (domain === 'appearance') return { ...value, appearance: { theme: cloud.theme } }
  if (domain === 'launcher') return { ...value, launcher: { selectedItemIds: [...cloud.selectedItemIds] } }
  if (domain === 'preferences') return { ...value, preferences: {} }
  return value
}

export function reconcileInitial(localPortable, cloudByDomain) {
  let portable = validatePortableConfig(localPortable)
  if (!portable) throw new Error('sync/invalid-local-config')
  const seed = []
  const blocked = []

  for (const domain of DOMAINS) {
    const cloud = cloudByDomain[domain]
    if (!cloud || cloud.status === 'missing') {
      seed.push(domain)
    } else if (cloud.status === 'ready') {
      portable = applyDomain(portable, domain, cloud.data)
    } else {
      blocked.push(domain)
    }
  }

  return { portable, seed, blocked }
}

export function sameDomain(portable, domain, cloudData) {
  return JSON.stringify(toDomain(portable, domain)) === JSON.stringify(cloudData)
}
