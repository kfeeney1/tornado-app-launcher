import { expect, test } from '@playwright/test'
import { signInTestUser } from './auth-helpers.js'

const accountCacheKey = 'tornado-account-portable-v1:test-existing@tornado.test'

test.describe('Phase B shared parity contract', () => {
  test('launcher ordering and appearance propagate together across active clients', async ({ context, page }) => {
    await signInTestUser(page)
    const second = await context.newPage()
    await second.goto('/')
    await second.getByRole('heading', { name: 'Apps' }).waitFor()

    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Light' }).click()
    await expect(second.locator('.app')).toHaveClass(/light/)

    await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Home' }).click()
    await page.getByRole('button', { name: 'Remove Spotify from launcher' }).click()
    await expect(second.getByRole('button', { name: 'Remove Spotify from launcher' })).toHaveCount(0)

    const firstCache = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), accountCacheKey)
    const secondCache = await second.evaluate(key => JSON.parse(localStorage.getItem(key)), accountCacheKey)
    expect(secondCache.appearance.theme).toBe(firstCache.appearance.theme)
    expect(secondCache.launcher.selectedItemIds).toEqual(firstCache.launcher.selectedItemIds)
  })

  test('portable account cache contains stable product state but no Windows native path data', async ({ page }) => {
    await signInTestUser(page)

    const portable = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), accountCacheKey)
    const serialized = JSON.stringify(portable)

    expect(portable).toHaveProperty('appearance')
    expect(portable).toHaveProperty('launcher.selectedItemIds')
    expect(serialized).not.toMatch(/[A-Za-z]:[\\/]/)
    expect(serialized).not.toContain('executablePath')
    expect(serialized).not.toContain('shortcutPath')
    expect(serialized).not.toContain('startMenuPath')
    expect(serialized).not.toContain('nativeLaunchTarget')
  })

  test('device-local data survives portable sync changes without entering account cache', async ({ page }) => {
    await signInTestUser(page)
    await page.evaluate(() => {
      const device = JSON.parse(localStorage.getItem('tornado-device-config-v1'))
      device.nativePreferences = { localPerformanceMode: 'balanced' }
      device.launchTargets = { minecraft: { executablePath: 'C:/Games/Minecraft.exe', source: 'manual', updatedAt: 1 } }
      localStorage.setItem('tornado-device-config-v1', JSON.stringify(device))
    })

    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Light' }).click()

    const state = await page.evaluate(key => ({
      portable: JSON.parse(localStorage.getItem(key)),
      device: JSON.parse(localStorage.getItem('tornado-device-config-v1')),
    }), accountCacheKey)

    expect(JSON.stringify(state.portable)).not.toContain('C:/Games/Minecraft.exe')
    expect(state.device.launchTargets.minecraft.executablePath).toBe('C:/Games/Minecraft.exe')
  })
})
