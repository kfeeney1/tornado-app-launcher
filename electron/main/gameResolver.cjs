const fs = require('node:fs/promises')
const path = require('node:path')
const { discoverInstalledApps } = require('./installedApps.cjs')

const SUPPORTED_GAME_IDS = new Set(['minecraft', 'fortnite', 'roblox'])
const MAX_EPIC_MANIFESTS = 200
const MAX_MANIFEST_BYTES = 512 * 1024

function resolveGameEvidence(appId, { discoveredApps = [], epicManifests = [] } = {}) {
  if (!SUPPORTED_GAME_IDS.has(appId)) return null

  if (appId === 'minecraft' || appId === 'roblox') {
    const installed = discoveredApps.some(app => app?.appId === appId)
    return Object.freeze({ appId, installed, launcher: appId === 'minecraft' ? 'minecraft-launcher' : 'roblox' })
  }

  const installed = epicManifests.some(manifest => {
    if (!manifest || typeof manifest !== 'object') return false
    const displayName = String(manifest.DisplayName || '').toLowerCase()
    const appName = String(manifest.AppName || '').toLowerCase()
    const catalogItemId = String(manifest.CatalogItemId || '').toLowerCase()
    return displayName === 'fortnite' || appName.includes('fortnite') || catalogItemId === '4fe75bbc5a674f4f9b356b5c90567da5'
  })
  return Object.freeze({ appId, installed, launcher: 'epic-games' })
}

function getEpicManifestRoot(env = process.env) {
  return env.PROGRAMDATA ? path.join(env.PROGRAMDATA, 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests') : null
}

async function readEpicManifests(env = process.env) {
  const root = getEpicManifestRoot(env)
  if (!root) return []

  let entries
  try {
    entries = await fs.readdir(root, { withFileTypes: true })
  } catch {
    return []
  }

  const manifests = []
  for (const entry of entries.slice(0, MAX_EPIC_MANIFESTS)) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.item')) continue
    const filePath = path.join(root, entry.name)
    try {
      const stats = await fs.stat(filePath)
      if (stats.size <= 0 || stats.size > MAX_MANIFEST_BYTES) continue
      const parsed = JSON.parse(await fs.readFile(filePath, 'utf8'))
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) manifests.push(parsed)
    } catch {
      // Ignore stale or malformed Epic manifests.
    }
  }
  return manifests
}

async function resolveInstalledGame(appId, options = {}) {
  if (!SUPPORTED_GAME_IDS.has(appId)) return null
  if ((options.platform || process.platform) !== 'win32') return Object.freeze({ appId, installed: false, launcher: null })

  const discoveredApps = options.discoveredApps || await discoverInstalledApps({ platform: 'win32', env: options.env || process.env })
  const epicManifests = appId === 'fortnite'
    ? (options.epicManifests || await readEpicManifests(options.env || process.env))
    : []
  return resolveGameEvidence(appId, { discoveredApps, epicManifests })
}

module.exports = {
  MAX_EPIC_MANIFESTS,
  MAX_MANIFEST_BYTES,
  SUPPORTED_GAME_IDS,
  getEpicManifestRoot,
  readEpicManifests,
  resolveGameEvidence,
  resolveInstalledGame,
}
