import { expect, test } from '@playwright/test'
import { signInTestUser } from './auth-helpers.js'

test.describe('Phase C shared navigation regression', () => {
  test('primary views return cleanly to launcher home', async ({ page }) => {
    await signInTestUser(page)

    for (const view of ['Discover', 'Settings', 'Profile']) {
      const navName = view === 'Discover' ? 'Add Apps' : view
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: navName }).click()
      await expect(page.getByRole('heading', { name: view })).toBeVisible()
      await page.getByRole('button', { name: 'Home' }).click()
      await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible()
    }
  })

  test('browser history returns through Tornado views without losing launcher state', async ({ page }) => {
    await signInTestUser(page)
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await page.getByRole('button', { name: 'Profile' }).click()
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()

    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Launch Spotify/ })).toBeVisible()
  })
})
