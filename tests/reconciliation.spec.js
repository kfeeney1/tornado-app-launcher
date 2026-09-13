import { expect, test } from '@playwright/test'
import { signInTestUser } from './auth-helpers.js'

const UID = 'test-existing@tornado.test'
const accountKey = `tornado-account-portable-v1:${UID}`
const metaKey = `tornado-account-portable-meta-v1:${UID}`
const cloudKey = domain => `tornado-test-cloud-v1:${UID}:${domain}`
const basePortable = (theme = 'dark', selectedItemIds = ['spotify', 'discord', 'chrome', 'minecraft']) => ({ schemaVersion: 1, appearance: { theme }, launcher: { selectedItemIds }, preferences: {} })
const cloudDocs = portable => ({
  appearance: { schemaVersion: 1, theme: portable.appearance.theme },
  launcher: { schemaVersion: 1, selectedItemIds: portable.launcher.selectedItemIds },
  preferences: { schemaVersion: 1 },
})

async function seedBeforeLoad(page, values) {
  await page.addInitScript(seed => {
    for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, JSON.stringify(value))
  }, values)
}

test.describe('Stage 5 setup reconciliation', () => {
  test('legacy local setup initializes an empty account without being lost', async ({ page }) => {
    const local = basePortable('light', ['spotify', 'roblox', 'minecraft'])
    await seedBeforeLoad(page, { 'tornado-portable-config-v1': local })
    await signInTestUser(page)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const state = await page.evaluate(({ accountKey, metaKey, appearance, launcher }) => ({
      account: JSON.parse(localStorage.getItem(accountKey)),
      meta: JSON.parse(localStorage.getItem(metaKey)),
      appearance: JSON.parse(localStorage.getItem(appearance)),
      launcher: JSON.parse(localStorage.getItem(launcher)),
    }), { accountKey, metaKey, appearance: cloudKey('appearance'), launcher: cloudKey('launcher') })
    expect(state.account.appearance.theme).toBe('light')
    expect(state.account.launcher.selectedItemIds).toEqual(local.launcher.selectedItemIds)
    expect(state.appearance.theme).toBe('light')
    expect(state.launcher.selectedItemIds).toEqual(local.launcher.selectedItemIds)
    expect(state.meta.reconciled).toBe(true)
  })

  test('fresh device loads established account configuration without a prompt', async ({ page }) => {
    const remote = basePortable('light', ['roblox', 'spotify'])
    const docs = cloudDocs(remote)
    await seedBeforeLoad(page, {
      [cloudKey('appearance')]: docs.appearance,
      [cloudKey('launcher')]: docs.launcher,
      [cloudKey('preferences')]: docs.preferences,
    })
    await signInTestUser(page)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('.app')).toHaveClass(/light/)
    const cached = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), accountKey)
    expect(cached.launcher.selectedItemIds).toEqual(remote.launcher.selectedItemIds)
  })

  test('different meaningful setups prompt before sync and choosing account preserves cloud', async ({ page }) => {
    const local = basePortable('dark', ['spotify', 'discord', 'chrome', 'minecraft'])
    const remote = basePortable('light', ['spotify', 'discord', 'youtube', 'minecraft', 'roblox'])
    const docs = cloudDocs(remote)
    await seedBeforeLoad(page, {
      'tornado-portable-config-v1': local,
      [cloudKey('appearance')]: docs.appearance,
      [cloudKey('launcher')]: docs.launcher,
      [cloudKey('preferences')]: docs.preferences,
    })
    await signInTestUser(page)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Your Tornado setups are different')
    await dialog.getByRole('button', { name: 'Review differences' }).click()
    await expect(dialog).toContainText('Chrome')
    await expect(dialog).toContainText('YouTube')
    await dialog.getByRole('button', { name: 'Use account setup' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page.locator('.app')).toHaveClass(/light/)
    const state = await page.evaluate(({ accountKey, launcher }) => ({
      account: JSON.parse(localStorage.getItem(accountKey)),
      cloud: JSON.parse(localStorage.getItem(launcher)),
    }), { accountKey, launcher: cloudKey('launcher') })
    expect(state.account.launcher.selectedItemIds).toEqual(remote.launcher.selectedItemIds)
    expect(state.cloud.selectedItemIds).toEqual(remote.launcher.selectedItemIds)
    await page.reload()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('choosing this device requires confirmation, replaces cloud, and active client receives it', async ({ context, page }) => {
    await signInTestUser(page)
    await page.getByRole('button', { name: 'Profile' }).click()
    await expect(page.getByRole('status')).toContainText('Synced')

    const local = basePortable('light', ['roblox', 'minecraft'])
    await page.evaluate(({ accountKey, metaKey, local }) => {
      localStorage.setItem(accountKey, JSON.stringify(local))
      localStorage.setItem(metaKey, JSON.stringify({ ownerUid: 'test-existing@tornado.test', source: 'legacy', reconciled: false }))
    }, { accountKey, metaKey, local })

    const second = await context.newPage()
    await second.goto('/')
    const dialog = second.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Use this device' }).click()
    await expect(dialog).toContainText("Use this device's setup?")
    await dialog.getByRole('button', { name: 'Replace account setup' }).click()
    await expect(dialog).toHaveCount(0)

    await expect(page.locator('.app')).toHaveClass(/light/)
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Home' }).click()
    await expect(page.getByRole('button', { name: 'Remove Roblox from launcher' })).toBeVisible()
  })

  test('refresh and browser Back during unresolved conflict do not silently resolve it', async ({ page }) => {
    const local = basePortable('dark', ['spotify', 'minecraft'])
    const remote = basePortable('light', ['roblox', 'minecraft'])
    const docs = cloudDocs(remote)
    await seedBeforeLoad(page, {
      'tornado-portable-config-v1': local,
      [cloudKey('appearance')]: docs.appearance,
      [cloudKey('launcher')]: docs.launcher,
      [cloudKey('preferences')]: docs.preferences,
    })
    await signInTestUser(page)
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('offline unresolved setup remains locally usable and is not marked complete', async ({ context, page }) => {
    const local = basePortable('light', ['spotify', 'minecraft'])
    await seedBeforeLoad(page, { 'tornado-portable-config-v1': local })
    await context.setOffline(true)
    await page.goto('/')
    await page.getByLabel('Email').fill('existing@tornado.test')
    await page.getByLabel('Password').fill('Tornado123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove Spotify from launcher' })).toBeVisible()
    const meta = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), metaKey)
    expect(meta.reconciled).toBe(false)
    await context.setOffline(false)
    await expect.poll(async () => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.reconciled, metaKey)).toBe(true)
  })
})
