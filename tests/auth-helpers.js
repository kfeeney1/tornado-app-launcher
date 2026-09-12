export async function signInTestUser(page) {
  await page.goto('/')
  await page.getByLabel('Email').fill('existing@tornado.test')
  await page.getByLabel('Password').fill('Tornado123!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.getByRole('heading', { name: 'Apps' }).waitFor()
}

export async function signOutTestUser(page) {
  await page.getByRole('button', { name: 'Profile' }).click()
  await page.getByRole('button', { name: 'Sign Out' }).click()
  await page.getByRole('heading', { name: 'Sign in' }).waitFor()
}
