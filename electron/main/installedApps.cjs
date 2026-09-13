const fs = require('node:fs/promises')
const path = require('node:path')

const MAX_ENTRIES = 2000
const MAX_DEPTH = 4

const APP_ALIASES = Object.freeze({
  spotify: ['spotify'],
  discord: ['discord'],
  notion: ['notion'],
  minecraft: ['minecraft launcher', 'minecraft'],
  roblox: ['roblox player', 'roblox'],
})

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\.(lnk|url)$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function matchTornadoAppId(shortcutName) {
  const normalized = normalizeName(shortcutName)
  if (!normalized) return null
  for (const [appId, aliases] of Object.entries(APP_ALIASES)) {
    if (aliases.some(alias => normalized === alias || normalized.startsWith(`${alias} `))) return appId
  }
  return null
}

function getStartMenuRoots(env = process.env) {
  const roots = []
  if (env.APPDATA) roots.push(path.join(env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs'))
  if (env.PROGRAMDATA) roots.push(path.join(env.PROGRAMDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs'))
  return [...new Set(roots)]
}

async function collectShortcutNames(root, depth = 0, state = { count: 0 }) {
  if (depth > MAX_DEPTH || state.count >= MAX_ENTRIES) return []
  let entries
  try {
    entries = await fs.readdir(root, { withFileTypes: true })
  } catch {
    return []
  }

  const names = []
  for (const entry of entries) {
    if (state.count >= MAX_ENTRIES) break
    state.count += 1
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) {
      names.push(...await collectShortcutNames(path.join(root, entry.name), depth + 1, state))
      continue
    }
    if (entry.isFile() && /\.(lnk|url)$/i.test(entry.name)) names.push(entry.name)
  }
  return names
}

function matchDiscoveredNames(names) {
  const results = new Map()
  for (const name of Array.isArray(names) ? names : []) {
    const appId = matchTornadoAppId(name)
    if (!appId || results.has(appId)) continue
    results.set(appId, Object.freeze({ appId, source: 'start-menu' }))
  }
  return [...results.values()].sort((a, b) => a.appId.localeCompare(b.appId))
}

async function discoverInstalledApps({ platform = process.platform, env = process.env } = {}) {
  if (platform !== 'win32') return []
  const state = { count: 0 }
  const names = []
  for (const root of getStartMenuRoots(env)) {
    names.push(...await collectShortcutNames(root, 0, state))
  }
  return matchDiscoveredNames(names)
}

module.exports = {
  APP_ALIASES,
  MAX_DEPTH,
  MAX_ENTRIES,
  discoverInstalledApps,
  getStartMenuRoots,
  matchDiscoveredNames,
  matchTornadoAppId,
  normalizeName,
}
