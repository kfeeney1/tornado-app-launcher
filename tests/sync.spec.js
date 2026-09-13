import { expect, test } from '@playwright/test'
import { signInTestUser, signOutTestUser } from './auth-helpers.js'

test.describe('Tornado account sync', () => {
  test('portable appearance and launcher changes propagate to another active client', async ({ context, page }) => {
    await signInTestUser(page)
    const second = await context.newPage()
    await second.goto('/')
    await second.getByRole('heading', { name: 'Apps' }).waitFor()

    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Light' }).click()
    await expect(page.locator('.app')).toHaveClass(/light/)
    await expect(second.locator('.app')).toHaveClass(/light/)

    await page.getByRole('button', { name: 'Home' }).click()
    await page.getByRole('button', { name: 'Remove Spotify from launcher' }).click()
    await expect(page.getByRole('button', { name: 'Remove Spotify from launcher' })).toHaveCount(0)
    await expect(second.getByRole('button', { name: 'Remove Spotify from launcher' })).toHaveCount(0)
  })

  test('established cloud configuration restores after account cache is cleared', async ({ page }) => {
    await signInTestUser(page)
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Light' }).click()
    await expect(page.locator('.app')).toHaveClass(/light/)
    await page.getByRole('button', { name: 'Profile' }).click()
    await expect(page.getByRole('status')).toContainText('Synced')

    await page.evaluate(() => {
      const email = localStorage.getItem('tornado-test-auth-session')
      localStorage.removeItem(`tornado-account-portable-v1:test-${email}`)
    })
    await page.reload()
    await page.getByRole('heading', { name: 'Profile' }).waitFor()
    await expect(page.locator('.app')).toHaveClass(/light/)
  })

  test('offline portable changes remain usable and flush after reconnect', async ({ context, page }) => {
    await signInTestUser(page)
    await context.setOffline(true)
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Light' }).click()
    await expect(page.locator('.app')).toHaveClass(/light/)
    await page.getByRole('button', { name: 'Profile' }).click()
    await expect(page.getByRole('status')).toContainText('Offline')

    await context.setOffline(false)
    await expect(page.getByRole('status')).toContainText('Synced')
    const syncedTheme = await page.evaluate(() => JSON.parse(localStorage.getItem('tornado-test-cloud-v1:test-existing@tornado.test:appearance'))?.theme)
    expect(syncedTheme).toBe('light')
  })

  test('account switching never exposes the previous account portable configuration', async ({ page }) => {
    await signInTestUser(page)
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Light' }).click()
    await page.getByRole('button', { name: 'Profile' }).click()
    await expect(page.getByRole('status')).toContainText('Synced')
    await page.getByRole('button', { name: 'Sign Out' }).click()

    await page.getByRole('button', { name: 'Create account' }).click()
    await page.getByLabel('Email').fill('second-player@tornado.test')
    await page.getByLabel('Password', { exact: true }).fill('Tornado123!')
    await page.getByLabel('Confirm password').fill('Tornado123!')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
    await expect(page.locator('.app')).toHaveClass(/dark/)

    const caches = await page.evaluate(() => ({
      first: JSON.parse(localStorage.getItem('tornado-account-portable-v1:test-existing@tornado.test')),
      second: JSON.parse(localStorage.getItem('tornado-account-portable-v1:test-second-player@tornado.test')),
    }))
    expect(caches.first.appearance.theme).toBe('light')
    expect(caches.second.appearance.theme).toBe('dark')

    await signOutTestUser(page)
    await signInTestUser(page)
    await expect(page.locator('.app')).toHaveClass(/light/)
  })

  test('sync status is exposed without blocking the launcher', async ({ page }) => {
    await signInTestUser(page)
    await page.getByRole('button', { name: 'Profile' }).click()
    await expect(page.getByRole('heading', { name: 'Tornado Sync' })).toBeVisible()
    await expect(page.getByRole('status')).toContainText(/Synced|Syncing/)
  })
})
