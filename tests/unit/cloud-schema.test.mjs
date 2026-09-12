import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyCloudDocument,
  isStableTornadoId,
  validateAppearanceConfig,
  validateLauncherConfig,
  validateUserProfile,
} from '../../src/cloud/schema.js'

const timestamp = { toMillis: () => 1 }

test('validates a supported user profile without trusting arbitrary data', () => {
  const profile = {
    schemaVersion: 1,
    email: 'user@tornado.test',
    displayName: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  assert.equal(validateUserProfile(profile), profile)
  assert.equal(validateUserProfile({ ...profile, schemaVersion: 99 }), null)
  assert.equal(validateUserProfile({ ...profile, email: 123 }), null)
})

test('validates appearance and launcher documents independently', () => {
  assert.deepEqual(validateAppearanceConfig({ schemaVersion: 1, theme: 'dark' }), { schemaVersion: 1, theme: 'dark' })
  assert.equal(validateAppearanceConfig({ schemaVersion: 1, theme: 'neon' }), null)

  const launcher = validateLauncherConfig({ schemaVersion: 1, selectedItemIds: ['minecraft', 'spotify'] })
  assert.deepEqual(launcher, { schemaVersion: 1, selectedItemIds: ['minecraft', 'spotify'] })
  assert.equal(validateLauncherConfig({ schemaVersion: 1, selectedItemIds: ['minecraft', 'minecraft'] }), null)
  assert.equal(validateLauncherConfig({ schemaVersion: 1, selectedItemIds: ['C:\\Games\\Minecraft.exe'] }), null)
})

test('stable Tornado IDs stay platform-neutral', () => {
  assert.equal(isStableTornadoId('roblox'), true)
  assert.equal(isStableTornadoId('geo-guessr'), true)
  assert.equal(isStableTornadoId('com.roblox.client'), false)
  assert.equal(isStableTornadoId('C:\\Program Files\\Game.exe'), false)
})

test('missing, malformed and unsupported config states remain distinguishable', () => {
  assert.deepEqual(classifyCloudDocument('launcher', { schemaVersion: 99, selectedItemIds: [] }), { status: 'malformed', data: null })
  assert.deepEqual(classifyCloudDocument('future-area', { schemaVersion: 1 }), { status: 'unsupported', data: null })
})
