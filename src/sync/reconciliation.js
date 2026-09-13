import { createDefaultPortableConfig, validatePortableConfig } from '../config/localConfig.js'
import { DOMAINS, applyDomain, sameDomain, toDomain } from './syncLogic.js'

export const MIGRATION_STATE = Object.freeze({
  NOT_REQUIRED: 'not-required',
  LOCAL_ONLY: 'local-only',
  CLOUD_ONLY: 'cloud-only',
  EQUIVALENT: 'equivalent',
  CONFLICT: 'conflict',
  MIGRATING: 'migrating',
  COMPLETE: 'complete',
  ERROR: 'error',
  OFFLINE: 'offline',
})

export function normalizePortableConfig(value) {
  const validated = validatePortableConfig(value)
  if (!validated) return null
  return {
    schemaVersion: validated.schemaVersion,
    appearance: { theme: validated.appearance.theme },
    launcher: { selectedItemIds: [...validated.launcher.selectedItemIds] },
    preferences: { ...validated.preferences },
  }
}

export function isFreshDefaultPortable(value) {
  const normalized = normalizePortableConfig(value)
  const defaults = normalizePortableConfig(createDefaultPortableConfig())
  return Boolean(normalized && defaults && JSON.stringify(normalized) === JSON.stringify(defaults))
}

export function comparePortableConfigs(localValue, cloudValue) {
  const local = normalizePortableConfig(localValue)
  const cloud = normalizePortableConfig(cloudValue)
  if (!local || !cloud) return { equivalent: false, invalid: true, differences: { appsAndGames: true, appearance: true, preferences: true } }
  const differences = {
    appsAndGames: JSON.stringify(local.launcher.selectedItemIds) !== JSON.stringify(cloud.launcher.selectedItemIds),
    appearance: local.appearance.theme !== cloud.appearance.theme,
    preferences: JSON.stringify(local.preferences) !== JSON.stringify(cloud.preferences),
  }
  return { equivalent: !Object.values(differences).some(Boolean), invalid: false, differences }
}

export function buildPortableFromCloud(localValue, cloudByDomain) {
  let portable = normalizePortableConfig(localValue)
  if (!portable) throw new Error('sync/invalid-local-config')
  const missing = []
  const blocked = []
  let readyCount = 0
  for (const domain of DOMAINS) {
    const cloud = cloudByDomain[domain]
    if (!cloud || cloud.status === 'missing') {
      missing.push(domain)
      continue
    }
    if (cloud.status !== 'ready') {
      blocked.push(domain)
      continue
    }
    readyCount += 1
    portable = applyDomain(portable, domain, cloud.data)
  }
  return { portable, missing, blocked, readyCount }
}

export function determineInitialReconciliation(localState, cloudByDomain) {
  const local = normalizePortableConfig(localState?.portable)
  if (!local) return { state: MIGRATION_STATE.ERROR, reason: 'invalid-local', blocked: [] }
  const cloud = buildPortableFromCloud(local, cloudByDomain)
  if (cloud.blocked.length) return { state: MIGRATION_STATE.ERROR, reason: 'invalid-cloud', blocked: cloud.blocked, portable: local }

  if (localState?.reconciled) {
    return { state: MIGRATION_STATE.NOT_REQUIRED, portable: local, cloudPortable: cloud.portable, seed: cloud.missing, differences: comparePortableConfigs(local, cloud.portable).differences }
  }

  if (cloud.readyCount === 0) {
    return { state: MIGRATION_STATE.LOCAL_ONLY, portable: local, cloudPortable: null, seed: [...DOMAINS], differences: null }
  }

  if (localState?.source === 'fresh') {
    return { state: MIGRATION_STATE.CLOUD_ONLY, portable: cloud.portable, cloudPortable: cloud.portable, seed: cloud.missing, differences: comparePortableConfigs(local, cloud.portable).differences }
  }

  const comparison = comparePortableConfigs(local, cloud.portable)
  if (comparison.equivalent) {
    return { state: MIGRATION_STATE.EQUIVALENT, portable: local, cloudPortable: cloud.portable, seed: cloud.missing, differences: comparison.differences }
  }

  return {
    state: MIGRATION_STATE.CONFLICT,
    portable: local,
    cloudPortable: cloud.portable,
    seed: cloud.missing,
    differences: comparison.differences,
  }
}

export function portableDomainEntries(portable) {
  return Object.fromEntries(DOMAINS.map(domain => [domain, toDomain(portable, domain)]))
}

export function cloudMatchesPortable(portable, cloudByDomain) {
  return DOMAINS.every(domain => cloudByDomain[domain]?.status === 'ready' && sameDomain(portable, domain, cloudByDomain[domain].data))
}
