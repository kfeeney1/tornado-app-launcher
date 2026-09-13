import { expect, test } from '@playwright/test'
import { signInTestUser } from './auth-helpers.js'

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

    await page.evaluate(() => {
      const email = localStorage.getItem('tornado-test-auth-session')
      localStorage.removeItem(`tornado-account-portable-v1:test-${email}`)
    })
    await page.reload()
    await page.getByRole('heading', { name: 'Apps' }).waitFor()
    await expect(page.locator('.app')).toHaveClass(/light/)
  })

  test('sync status is exposed without blocking the launcher', async ({ page }) => {
    await signInTestUser(page)
    await page.getByRole('button', { name: 'Profile' }).click()
    await expect(page.getByRole('heading', { name: 'Tornado Sync' })).toBeVisible()
    await expect(page.getByRole('status')).toContainText(/Synced|Syncing/)
  })
})
