import { test, expect } from '@playwright/test'
import { catalog } from '../src/data/catalog.js'

test('default native games expose launch and install fallbacks', async () => {
  const games = catalog
    .filter(item => ['minecraft', 'fortnite', 'roblox'].includes(item.id))
    .map(({ id, launchUrl, installUrl, playStoreUrl }) => ({ id, launchUrl, installUrl, playStoreUrl }))

  expect(games).toHaveLength(3)
  for (const game of games) {
    expect(game.launchUrl, `${game.id} should have a native launch URL`).toBeTruthy()
    expect(game.installUrl, `${game.id} should have an install fallback`).toMatch(/^https:\/\//)
  }

  expect(games.find(game => game.id === 'minecraft')?.playStoreUrl).toContain('play.google.com')
  expect(games.find(game => game.id === 'roblox')?.playStoreUrl).toContain('play.google.com')
})

test('game tiles are actionable launcher buttons', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start' }).click()

  await expect(page.getByRole('button', { name: 'Launch Minecraft' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Launch Fortnite' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Launch Roblox' })).toBeEnabled()
})
