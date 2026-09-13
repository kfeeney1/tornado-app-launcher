import { test, expect } from '@playwright/test'
import { signInTestUser } from './auth-helpers.js'

const uid = 'test-existing@tornado.test'
const registryKey = `tornado-test-devices-v1:${uid}`

test('current device registers once and persists across reloads', async ({ page }) => {
  await signInTestUser(page)
  await page.getByRole('button', { name: 'Profile' }).click()
  await expect(page.getByRole('heading', { name: 'Devices' })).toBeVisible()
  await expect(page.getByText('This device')).toBeVisible()

  const before = await page.evaluate(key => {
    const config = JSON.parse(localStorage.getItem('tornado-device-config-v1'))
    const devices = JSON.parse(localStorage.getItem(key) || '[]')
    return { installationId: config.installationId, count: devices.length }
  }, registryKey)
  expect(before.installationId).toBeTruthy()
  expect(before.count).toBe(1)

  await page.reload()
  await page.getByRole('button', { name: 'Profile' }).click()
  await expect(page.getByText('This device')).toBeVisible()
  const after = await page.evaluate(key => ({
    installationId: JSON.parse(localStorage.getItem('tornado-device-config-v1')).installationId,
    count: JSON.parse(localStorage.getItem(key) || '[]').length,
  }), registryKey)
  expect(after.installationId).toBe(before.installationId)
  expect(after.count).toBe(1)
})

test('old device can be removed while current device remains', async ({ page }) => {
  await signInTestUser(page)
  await page.evaluate(key => {
    const currentId = JSON.parse(localStorage.getItem('tornado-device-config-v1')).installationId
    const current = JSON.parse(localStorage.getItem(key) || '[]')
    localStorage.setItem(key, JSON.stringify([
      ...current.filter(device => device.deviceId === currentId),
      {
        schemaVersion: 1,
        deviceId: '22222222-2222-4222-8222-222222222222',
        platform: 'web',
        deviceName: 'Firefox on Linux',
        clientType: 'browser',
        appVersion: '0.1.0',
        createdAt: '2026-09-10T10:00:00.000Z',
        lastSeenAt: '2026-09-10T10:00:00.000Z',
      },
    ]))
  }, registryKey)

  await page.getByRole('button', { name: 'Profile' }).click()
  await expect(page.getByText('Firefox on Linux')).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Remove Firefox on Linux from device list' }).click()
  await expect(page.getByText('Firefox on Linux')).toHaveCount(0)
  await expect(page.getByText('This device')).toBeVisible()
})

test('device registry stays account scoped in test backend', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('tornado-test-devices-v1:test-other@tornado.test', JSON.stringify([{ schemaVersion: 1, deviceId: '33333333-3333-4333-8333-333333333333', platform: 'web', deviceName: 'Other account device', clientType: 'browser', appVersion: null, createdAt: '2026-09-12T10:00:00.000Z', lastSeenAt: '2026-09-12T10:00:00.000Z' }]))
  })
  await signInTestUser(page)
  await page.getByRole('button', { name: 'Profile' }).click()
  await expect(page.getByText('Other account device')).toHaveCount(0)
})
