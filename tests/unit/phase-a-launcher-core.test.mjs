import test from 'node:test'
import assert from 'node:assert/strict'
import { PLATFORM_CAPABILITIES } from '../../src/platform/index.js'
import { resolveLaunchTarget } from '../../src/platform/launchResolver.js'
import { launchApp } from '../../src/platform/launchService.js'

test('Windows native-capable catalogue apps resolve locally while Web stays on Web', () => {
  const discord = { id: 'discord', type: 'app', url: 'https://discord.com/app' }
  assert.deepEqual(resolveLaunchTarget(discord, 'windows'), {
    appId: 'discord', type: 'installed-app', fallbackUrl: 'https://discord.com/app',
  })
  assert.deepEqual(resolveLaunchTarget(discord, 'web'), {
    appId: 'discord', type: 'url', url: 'https://discord.com/app', fallbackUrl: 'https://discord.com/app',
  })
})

test('stale installed game resolution is invalidated, rediscovered and retried once', async () => {
  const item = { id: 'minecraft', type: 'game', launchUrl: 'minecraft://', installUrl: 'https://www.minecraft.net/download' }
  let resolutionCalls = 0
  let launchCalls = 0
  let fallback = null
  const platform = {
    kind: 'windows',
    can: capability => capability === PLATFORM_CAPABILITIES.GAME_RESOLUTION,
    resolveGame: async () => {
      resolutionCalls += 1
      return { ok: true, value: { appId: 'minecraft', installed: true, launcher: 'minecraft-launcher' } }
    },
    launchTarget: async () => {
      launchCalls += 1
      return launchCalls === 1 ? { ok: false, reason: 'launch-failed' } : { ok: true, value: true }
    },
    openExternal: async url => { fallback = url; return { ok: true, value: true } },
  }

  assert.deepEqual(await launchApp(item, platform), { ok: true, value: true })
  assert.equal(resolutionCalls, 2)
  assert.equal(launchCalls, 2)
  assert.equal(fallback, null)
})

test('rediscovery proving a game is missing sends the user to the official install destination', async () => {
  const item = { id: 'roblox', type: 'game', launchUrl: 'roblox://', installUrl: 'https://www.roblox.com/download' }
  let resolutionCalls = 0
  let launchCalls = 0
  let opened = null
  const platform = {
    kind: 'windows',
    can: capability => capability === PLATFORM_CAPABILITIES.GAME_RESOLUTION,
    resolveGame: async () => {
      resolutionCalls += 1
      return {
        ok: true,
        value: { appId: 'roblox', installed: resolutionCalls === 1, launcher: 'roblox' },
      }
    },
    launchTarget: async () => { launchCalls += 1; return { ok: false, reason: 'launch-failed' } },
    openExternal: async url => { opened = url; return { ok: true, value: true } },
  }

  assert.deepEqual(await launchApp(item, platform), { ok: true, value: true })
  assert.equal(launchCalls, 1)
  assert.equal(resolutionCalls, 2)
  assert.equal(opened, 'https://www.roblox.com/download')
})
