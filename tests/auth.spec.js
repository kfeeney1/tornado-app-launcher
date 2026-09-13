import { test, expect } from '@playwright/test'
import { signInTestUser, signOutTestUser } from './auth-helpers.js'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('signed-out Tornado shows sign in and auth navigation works', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await page.getByRole('button', { name: 'Forgot password?' }).click()
  await expect(page.getByRole('heading', { name: 'Forgot password?' })).toBeVisible()
})

test('registration authenticates and reaches Tornado Home', async ({ page }) => {
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByLabel('Email').fill('new-player@tornado.test')
  await page.getByLabel('Password', { exact: true }).fill('Tornado123!')
  await page.getByLabel('Confirm password').fill('Tornado123!')
  await page.getByRole('button', { name: 'Create Account' }).click()

  await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
})

test('valid sign in persists across reload', async ({ page }) => {
  await signInTestUser(page)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Apps' })).toBeVisible()
})

test('sign out returns to login without clearing the account-scoped launcher cache', async ({ page }) => {
  await signInTestUser(page)
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Light' }).click()
  await signOutTestUser(page)

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  const portableConfig = await page.evaluate(() => JSON.parse(localStorage.getItem('tornado-account-portable-v1:test-existing@tornado.test')))
  expect(portableConfig.appearance.theme).toBe('light')
  await expect(page.evaluate(() => localStorage.getItem('tornado-theme'))).resolves.toBeNull()
})

test('invalid credentials show a useful error and remain stable', async ({ page }) => {
  await page.getByLabel('Email').fill('existing@tornado.test')
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(page.getByRole('alert')).toHaveText('Incorrect email or password.')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('forgot password uses neutral success messaging', async ({ page }) => {
  await page.getByRole('button', { name: 'Forgot password?' }).click()
  await page.getByLabel('Email').fill('unknown@tornado.test')
  await page.getByRole('button', { name: 'Send Reset Email' }).click()

  await expect(page.getByRole('status')).toHaveText('If an account exists for that email address, a reset email has been sent.')
})

test('password mismatch is rejected before registration', async ({ page }) => {
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByLabel('Email').fill('new-player@tornado.test')
  await page.getByLabel('Password', { exact: true }).fill('Tornado123!')
  await page.getByLabel('Confirm password').fill('Different123!')
  await page.getByRole('button', { name: 'Create Account' }).click()

  await expect(page.getByRole('alert')).toHaveText('Passwords do not match.')
})
