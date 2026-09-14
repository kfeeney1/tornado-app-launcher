import { test, expect } from '@playwright/test'
import { signInTestUser } from './auth-helpers.js'

async function start(page) {
  await signInTestUser(page)
}

const pageHome = page => page.getByRole('main').getByRole('button', { name: 'Home' })

async function dismissExitConfirmation(page) {
  const dialogPromise = page.waitForEvent('dialog')
  const backPromise = page.evaluate(() => window.history.back())
  const dialog = await dialogPromise
  expect(dialog.type()).toBe('confirm')
  expect(dialog.message()).toBe('Exit Tornado?')
  await dialog.dismiss()
  await backPromise
}

test('launcher, settings, profile and appearance work', async ({ page }) => {
  await start(page)
  await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible()
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()
  await expect(page.getByText(/^Tornado v\d+\.\d+\.\d+$/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Check for updates' })).toBeVisible()
  await page.getByRole('button', { name: 'Light' }).click()
  await expect(page.locator('.app')).toHaveClass(/light/)
  await pageHome(page).click()
  await page.getByRole('button', { name: 'Profile' }).click()
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
  await expect(page.getByText('existing@tornado.test').first()).toBeVisible()
})

test('browser back and forward navigate inside Tornado', async ({ page }) => {
  await start(page)

  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
  await expect(page).toHaveURL('/')

  await page.goForward()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  await page.getByRole('button', { name: 'Profile' }).click()
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()

  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
})

test('browser back asks before leaving from signed-in Home', async ({ page }) => {
  await start(page)
  await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()

  await dismissExitConfirmation(page)
  await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
})

test('store search can add and launcher can remove an item', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: 'Add Apps' }).click()
  await page.getByLabel('Search store').fill('Notion')
  const card = page.locator('.store-card').filter({ hasText: 'Notion' })
  await card.getByRole('button', { name: 'Add' }).click()
  await expect(card.getByRole('button', { name: 'Added' })).toBeVisible()
  await pageHome(page).click()
  await expect(page.getByText('Notion', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Remove Notion from launcher' }).click()
  await expect(page.getByText('Notion', { exact: true })).toHaveCount(0)
})

test('mobile viewport has no horizontal overflow', async ({ page }) => {
  await start(page)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBeFalsy()
})
