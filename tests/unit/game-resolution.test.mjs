import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createPlatform, PLATFORM_CAPABILITIES } from '../../src/platform/index.js'
import { launchApp } from '../../src/platform/launchService.js'

const require = createRequire(import.meta.url)
const { getEpicManifestRoot, resolveGameEvidence } = require('../../electron/main/gameResolver.cjs')

test('resolves Minecraft and Roblox only from actual discovery evidence', () => {
  assert.deepEqual(resolveGameEvidence('minecraft', { discoveredApps: [{ appId: 'minecraft' }] }), {
    appId: 'minecraft', installed: true, launcher: 'minecraft-launcher',
  })
  assert.deepEqual(resolveGameEvidence('roblox', { discoveredApps: [] }), {
    appId: 'roblox', installed: false, launcher: 'roblox',
  })
})

test('resolves Fortnite from bounded Epic manifest evidence, not launcher presence', () => {
  assert.deepEqual(resolveGameEvidence('fortnite', { epicManifests: [{ DisplayName: 'Fortnite' }] }), {
    appId: 'fortnite', installed: true, launcher: 'epic-games',
  })
  assert.deepEqual(resolveGameEvidence('fortnite', { epicManifests: [{ DisplayName: 'Epic Games Launcher' }] }), {
    appId: 'fortnite', installed: false, launcher: 'epic-games',
  })
  assert.equal(resolveGameEvidence('unknown-game', {}), null)
})

test('Epic manifest location is narrowly scoped under ProgramData', () => {
  const root = getEpicManifestRoot({ PROGRAMDATA: 'C:\\ProgramData' }).replaceAll('\\', '/')
  assert.equal(root, 'C:/ProgramData/Epic/EpicGamesLauncher/Data/Manifests')
})

test('Windows adapter exposes sanitized game resolution without paths', async () => {
  const windows = createPlatform({ window: { tornadoPlatform: {
    getPlatform: () => 'windows',
    openExternal: async () => true,
    launchNativeApp: async () => true,
    getInstalledApps: async () => [],
    resolveGame: async appId => ({ appId, installed: true, launcher: 'epic-games', installPath: 'C:\\secret\\Fortnite' }),
  } } })

  assert.equal(windows.can(PLATFORM_CAPABILITIES.GAME_RESOLUTION), true)
  assert.deepEqual(await windows.resolveGame('fortnite'), {
    ok: true,
    value: { appId: 'fortnite', installed: true, launcher: 'epic-games' },
  })
})

test('missing game routes to official install fallback without attempting native launch', async () => {
  const item = {
    id: 'fortnite', type: 'game', launchUrl: 'com.epicgames.launcher://fortnite', installUrl: 'https://www.fortnite.com/download',
  }
  let nativeLaunches = 0
  let opened = null
  const platform = {
    kind: 'windows',
    can: capability => capability === PLATFORM_CAPABILITIES.GAME_RESOLUTION,
    resolveGame: async () => ({ ok: true, value: { appId: 'fortnite', installed: false, launcher: 'epic-games' } }),
    launchTarget: async () => { nativeLaunches += 1; return { ok: true, value: true } },
    openExternal: async url => { opened = url; return { ok: true, value: true } },
  }

  assert.deepEqual(await launchApp(item, platform), { ok: true, value: true })
  assert.equal(nativeLaunches, 0)
  assert.equal(opened, 'https://www.fortnite.com/download')
})

test('installed game launches and stale protocol failure falls back safely', async () => {
  const item = { id: 'minecraft', type: 'game', launchUrl: 'minecraft://', installUrl: 'https://www.minecraft.net/download' }
  let opened = null
  const platform = {
    kind: 'windows',
    can: capability => capability === PLATFORM_CAPABILITIES.GAME_RESOLUTION,
    resolveGame: async () => ({ ok: true, value: { appId: 'minecraft', installed: true, launcher: 'minecraft-launcher' } }),
    launchTarget: async () => ({ ok: false, reason: 'launch-failed' }),
    openExternal: async url => { opened = url; return { ok: true, value: true } },
  }

  assert.deepEqual(await launchApp(item, platform), { ok: true, value: true })
  assert.equal(opened, 'https://www.minecraft.net/download')
})
