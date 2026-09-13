import { test, expect } from '@playwright/test'
import { signInTestUser, signOutTestUser } from './auth-helpers.js'

const ACCOUNT_CACHE_KEY = 'tornado-account-portable-v1:test-existing@tornado.test'

test('existing legacy launcher configuration survives the Stage 3 upgrade and reload', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('tornado-theme', JSON.stringify('light'))
    localStorage.setItem('tornado-selection', JSON.stringify(['spotify', 'roblox', 'browser', 'minecraft']))
  })

  await signInTestUser(page)
  await expect(page.locator('.app')).toHaveClass(/light/)

  const appNames = await page.locator('.launcher-section').filter({ hasText: 'Apps' }).locator('.launch-target').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')?.replace('Launch ', '')))
  const gameNames = await page.locator('.launcher-section').filter({ hasText: 'Games' }).locator('.launch-target').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')?.replace('Launch ', '')))
  expect(appNames).toEqual(['Spotify', 'Browser'])
  expect(gameNames).toEqual(['Roblox', 'Minecraft'])

  const migrated = await page.evaluate(key => ({
    portable: JSON.parse(localStorage.getItem(key)),
    device: JSON.parse(localStorage.getItem('tornado-device-config-v1')),
    legacyTheme: localStorage.getItem('tornado-theme'),
    legacySelection: localStorage.getItem('tornado-selection'),
  }), ACCOUNT_CACHE_KEY)
  expect(migrated.portable.appearance.theme).toBe('light')
  expect(migrated.portable.launcher.selectedItemIds).toEqual(['spotify', 'roblox', 'browser', 'minecraft'])
  expect(migrated.device.schemaVersion).toBe(1)
  expect(migrated.legacyTheme).toBeNull()
  expect(migrated.legacySelection).toBeNull()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
  await expect(page.locator('.app')).toHaveClass(/light/)
  await expect(page.getByRole('button', { name: 'Launch Roblox' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Launch Fortnite' })).toHaveCount(0)
})

test('portable updates leave device data local and sign-out does not delete it', async ({ page }) => {
  await signInTestUser(page)
  await page.evaluate(() => {
    const device = JSON.parse(localStorage.getItem('tornado-device-config-v1'))
    device.nativePreferences = { localPerformanceMode: 'balanced' }
    device.launchTargets = { minecraft: { installed: true } }
    localStorage.setItem('tornado-device-config-v1', JSON.stringify(device))
  })

  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Light' }).click()

  const beforeSignOut = await page.evaluate(key => ({
    portable: JSON.parse(localStorage.getItem(key)),
    device: JSON.parse(localStorage.getItem('tornado-device-config-v1')),
  }), ACCOUNT_CACHE_KEY)
  expect(beforeSignOut.portable.appearance.theme).toBe('light')
  expect(beforeSignOut.portable).not.toHaveProperty('launchTargets')
  expect(beforeSignOut.device.launchTargets.minecraft.installed).toBe(true)
  expect(beforeSignOut.device.nativePreferences.localPerformanceMode).toBe('balanced')

  await signOutTestUser(page)
  const afterSignOut = await page.evaluate(key => ({
    portable: JSON.parse(localStorage.getItem(key)),
    device: JSON.parse(localStorage.getItem('tornado-device-config-v1')),
    authSession: localStorage.getItem('tornado-test-auth-session'),
  }), ACCOUNT_CACHE_KEY)
  expect(afterSignOut.authSession).toBeNull()
  expect(afterSignOut.portable).toEqual(beforeSignOut.portable)
  expect(afterSignOut.device).toEqual(beforeSignOut.device)
})
