import { test, expect } from '@playwright/test'
import { signInTestUser } from './auth-helpers.js'

const existingUid = 'test-existing@tornado.test'

async function openProfile(page) {
  await page.getByRole('button', { name: 'Profile' }).click()
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
}

async function createAccount(page, email, password = 'Tornado123!') {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: 'Create Account' }).click()
  await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('display name can be edited and survives reload', async ({ page }) => {
  await signInTestUser(page)
  await openProfile(page)

  await page.getByLabel('Display name').fill('  Kevin   Tornado  ')
  await page.getByRole('button', { name: 'Save display name' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Display name updated.' })).toBeVisible()
  await expect(page.locator('.profile-card').getByRole('heading', { name: 'Kevin Tornado' })).toBeVisible()

  await page.reload()
  await openProfile(page)
  await expect(page.locator('.profile-card').getByRole('heading', { name: 'Kevin Tornado' })).toBeVisible()
  await expect(page.getByLabel('Display name')).toHaveValue('Kevin Tornado')
})

test('another signed-in client shows the updated cloud profile', async ({ browser }) => {
  const contextA = await browser.newContext()
  const pageA = await contextA.newPage()
  await pageA.goto('/')
  await pageA.evaluate(() => localStorage.clear())
  await pageA.reload()
  await signInTestUser(pageA)
  await openProfile(pageA)
  await pageA.getByLabel('Display name').fill('Cross Client Player')
  await pageA.getByRole('button', { name: 'Save display name' }).click()
  await expect(pageA.locator('.profile-card').getByRole('heading', { name: 'Cross Client Player' })).toBeVisible()

  const portableState = await pageA.evaluate(uid => ({
    accounts: localStorage.getItem('tornado-test-auth-accounts-v2'),
    profile: localStorage.getItem(`tornado-test-profile-v1:${uid}`),
    cloudAppearance: localStorage.getItem(`tornado-test-cloud-v1:${uid}:appearance`),
    cloudLauncher: localStorage.getItem(`tornado-test-cloud-v1:${uid}:launcher`),
    cloudPreferences: localStorage.getItem(`tornado-test-cloud-v1:${uid}:preferences`),
  }), existingUid)

  const contextB = await browser.newContext()
  const pageB = await contextB.newPage()
  await pageB.goto('/')
  await pageB.evaluate(({ uid, state }) => {
    localStorage.clear()
    localStorage.setItem('tornado-test-auth-accounts-v2', state.accounts)
    localStorage.setItem('tornado-test-auth-session', uid)
    localStorage.setItem(`tornado-test-profile-v1:${uid}`, state.profile)
    if (state.cloudAppearance) localStorage.setItem(`tornado-test-cloud-v1:${uid}:appearance`, state.cloudAppearance)
    if (state.cloudLauncher) localStorage.setItem(`tornado-test-cloud-v1:${uid}:launcher`, state.cloudLauncher)
    if (state.cloudPreferences) localStorage.setItem(`tornado-test-cloud-v1:${uid}:preferences`, state.cloudPreferences)
  }, { uid: existingUid, state: portableState })
  await pageB.reload()
  await expect(pageB.getByRole('heading', { name: 'Apps' })).toBeVisible()
  await openProfile(pageB)
  await expect(pageB.locator('.profile-card').getByRole('heading', { name: 'Cross Client Player' })).toBeVisible()

  await contextA.close()
  await contextB.close()
})

test('password change invalidates old password and accepts new password', async ({ page }) => {
  await signInTestUser(page)
  await openProfile(page)
  await page.getByRole('button', { name: 'Change password' }).click()
  await page.getByLabel('Current password').last().fill('Tornado123!')
  await page.getByLabel('New password', { exact: true }).fill('NewTornado123!')
  await page.getByLabel('Confirm new password').fill('NewTornado123!')
  await page.getByRole('button', { name: 'Change password' }).last().click()
  await expect(page.getByRole('status').filter({ hasText: 'Password changed successfully.' })).toBeVisible()

  await page.getByRole('button', { name: 'Sign Out' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await page.getByLabel('Email').fill('existing@tornado.test')
  await page.getByLabel('Password').fill('Tornado123!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByRole('alert')).toHaveText('Incorrect email or password.')

  await page.getByLabel('Password').fill('NewTornado123!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
})

test('verification action is available without blocking launcher use', async ({ page }) => {
  await signInTestUser(page)
  await openProfile(page)
  await expect(page.getByText('Email not verified').first()).toBeVisible()
  await page.getByRole('button', { name: 'Send verification email' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Verification email sent.' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Home' }).click()
  await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
})

test('deleting a dedicated account clears account data and preserves device identity', async ({ page }) => {
  const email = `delete-${Date.now()}@tornado.test`
  const password = 'Tornado123!'
  await createAccount(page, email, password)
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Light' }).click()
  await openProfile(page)
  await expect(page.getByText('This device')).toBeVisible()

  const uid = `test-${email}`
  const before = await page.evaluate(userId => ({
    deviceConfig: localStorage.getItem('tornado-device-config-v1'),
    cache: localStorage.getItem(`tornado-account-portable-v1:${userId}`),
    profile: localStorage.getItem(`tornado-test-profile-v1:${userId}`),
    devices: localStorage.getItem(`tornado-test-devices-v1:${userId}`),
  }), uid)
  expect(before.deviceConfig).toBeTruthy()
  expect(before.cache).toBeTruthy()
  expect(before.profile).toBeTruthy()
  expect(before.devices).toBeTruthy()

  await page.getByRole('button', { name: 'Delete Tornado account' }).click()
  await page.getByLabel('Current password').last().fill(password)
  await page.getByRole('button', { name: 'Delete account permanently' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

  const after = await page.evaluate(userId => ({
    deviceConfig: localStorage.getItem('tornado-device-config-v1'),
    cache: localStorage.getItem(`tornado-account-portable-v1:${userId}`),
    meta: localStorage.getItem(`tornado-account-portable-meta-v1:${userId}`),
    pending: localStorage.getItem(`tornado-sync-pending-v1:${userId}`),
    profile: localStorage.getItem(`tornado-test-profile-v1:${userId}`),
    devices: localStorage.getItem(`tornado-test-devices-v1:${userId}`),
    cloudAppearance: localStorage.getItem(`tornado-test-cloud-v1:${userId}:appearance`),
    cloudLauncher: localStorage.getItem(`tornado-test-cloud-v1:${userId}:launcher`),
  }), uid)
  expect(after.deviceConfig).toBe(before.deviceConfig)
  expect(after.cache).toBeNull()
  expect(after.meta).toBeNull()
  expect(after.pending).toBeNull()
  expect(after.profile).toBeNull()
  expect(after.devices).toBeNull()
  expect(after.cloudAppearance).toBeNull()
  expect(after.cloudLauncher).toBeNull()

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByRole('alert')).toHaveText('Incorrect email or password.')
})
