import test from 'node:test'
import assert from 'node:assert/strict'
import { getOrCreateDeviceId, isValidDeviceId, defaultDeviceName } from '../../src/devices/deviceIdentity.js'
import { createDeviceRegistryService, LAST_SEEN_WRITE_INTERVAL_MS } from '../../src/devices/deviceRegistry.js'
import { formatLastActive, sortDevices } from '../../src/devices/deviceTypes.js'

function memoryStorage() {
  const values = new Map()
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }
}

function memoryBackend() {
  const byUser = new Map()
  return {
    async register(uid, deviceId, metadata, now) {
      const records = byUser.get(uid) ?? []
      const existing = records.find(item => item.deviceId === deviceId)
      const record = { schemaVersion: 1, deviceId, ...metadata, createdAt: existing?.createdAt ?? now, lastSeenAt: now }
      byUser.set(uid, [...records.filter(item => item.deviceId !== deviceId), record])
      return record
    },
    async list(uid) { return byUser.get(uid) ?? [] },
    async remove(uid, deviceId) { byUser.set(uid, (byUser.get(uid) ?? []).filter(item => item.deviceId !== deviceId)) },
  }
}

test('device id is random, valid and stable in device-local config', () => {
  const storage = memoryStorage()
  const first = getOrCreateDeviceId(storage)
  const second = getOrCreateDeviceId(storage)
  assert.equal(isValidDeviceId(first), true)
  assert.equal(second, first)
})

test('default web device names are useful without hardware identifiers', () => {
  assert.equal(defaultDeviceName('android'), 'Tornado Android')
  assert.equal(defaultDeviceName('windows'), 'Tornado Windows')
  assert.equal(defaultDeviceName('web', 'Mozilla/5.0 (Windows NT 10.0) Chrome/140.0.0.0 Safari/537.36'), 'Chrome on Windows')
})

test('registration is idempotent, preserves createdAt and is account isolated', async () => {
  const backend = memoryBackend()
  const service = createDeviceRegistryService({ backend })
  const metadata = { platform: 'web', deviceName: 'Chrome on Windows', clientType: 'browser', appVersion: '0.1.0' }
  const firstTime = new Date('2026-09-13T10:00:00Z')
  const later = new Date(firstTime.getTime() + LAST_SEEN_WRITE_INTERVAL_MS + 1)
  await service.registerCurrentDevice('user-a', 'device-a', metadata, { force: true, now: firstTime })
  await service.registerCurrentDevice('user-a', 'device-a', metadata, { force: true, now: later })
  await service.registerCurrentDevice('user-b', 'device-a', metadata, { force: true, now: later })
  const userA = await service.listDevices('user-a', 'device-a')
  const userB = await service.listDevices('user-b', 'device-a')
  assert.equal(userA.length, 1)
  assert.equal(userB.length, 1)
  assert.equal(userA[0].createdAt.getTime(), firstTime.getTime())
  assert.equal(userA[0].lastSeenAt.getTime(), later.getTime())
})

test('current device sorts first and old devices can be removed', async () => {
  const backend = memoryBackend()
  const service = createDeviceRegistryService({ backend })
  const metadata = { platform: 'web', deviceName: 'Browser', clientType: 'browser', appVersion: null }
  await service.registerCurrentDevice('user', 'old', metadata, { force: true, now: new Date('2026-09-12T10:00:00Z') })
  await service.registerCurrentDevice('user', 'current', metadata, { force: true, now: new Date('2026-09-13T10:00:00Z') })
  assert.deepEqual((await service.listDevices('user', 'current')).map(item => item.deviceId), ['current', 'old'])
  await service.removeDevice('user', 'old')
  assert.deepEqual((await service.listDevices('user', 'current')).map(item => item.deviceId), ['current'])
})

test('device sorting and last active formatting handle missing values', () => {
  const records = [{ deviceId: 'b', lastSeenAt: null }, { deviceId: 'a', lastSeenAt: '2026-09-13T09:59:00Z' }]
  assert.equal(sortDevices(records, 'b')[0].deviceId, 'b')
  assert.equal(formatLastActive(null), 'Last active unknown')
})
