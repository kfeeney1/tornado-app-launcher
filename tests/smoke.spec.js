import { test, expect } from '@playwright/test'

async function start(page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start' }).click()
}

const pageHome = page => page.getByRole('main').getByRole('button', { name: 'Home' })

test('launcher, settings, profile and appearance work', async ({ page }) => {
  await start(page)
  await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible()
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible()
  await page.getByRole('button', { name: 'Light' }).click()
  await expect(page.locator('.app')).toHaveClass(/light/)
  await pageHome(page).click()
  await page.getByRole('button', { name: 'Profile' }).click()
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
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
