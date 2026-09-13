import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeDisplayName,
  supportsPasswordAuthentication,
  validateDisplayName,
  validateEmail,
  validateNewPassword,
} from '../../src/account/accountValidation.js'
import { accountOwnedLocalKeys, clearAccountOwnedLocalData } from '../../src/account/accountLocalData.js'

test('display-name validation trims and normalizes whitespace', () => {
  assert.equal(normalizeDisplayName('  Kevin   Feeney  '), 'Kevin Feeney')
  assert.deepEqual(validateDisplayName('   '), { valid: false, value: '', message: 'Enter a display name.' })
  assert.equal(validateDisplayName('Kevin Feeney').valid, true)
  assert.equal(validateDisplayName('x'.repeat(81)).valid, false)
})

test('account email and password validation rejects invalid input', () => {
  assert.equal(validateEmail('not-an-email').valid, false)
  assert.equal(validateEmail(' Kevin@example.com ').value, 'kevin@example.com')
  assert.equal(validateNewPassword('short', 'short').valid, false)
  assert.deepEqual(validateNewPassword('Tornado123!', 'Different123!'), { valid: false, message: 'New passwords do not match.' })
  assert.equal(validateNewPassword('Tornado123!', 'Tornado123!').valid, true)
})

test('provider awareness exposes password actions only for password accounts', () => {
  assert.equal(supportsPasswordAuthentication(['password']), true)
  assert.equal(supportsPasswordAuthentication(['google.com']), false)
  assert.equal(supportsPasswordAuthentication([]), false)
})

test('account deletion clears account-owned cache without clearing device configuration', () => {
  const uid = 'user-a'
  const map = new Map()
  const store = {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
  }

  for (const key of accountOwnedLocalKeys(uid)) store.setItem(key, '{}')
  store.setItem('tornado-portable-legacy-owner-v1', JSON.stringify(uid))
  store.setItem('tornado-device-config-v1', JSON.stringify({ installationId: 'device-123' }))
  store.setItem('unrelated', 'keep')

  assert.equal(clearAccountOwnedLocalData(uid, store), true)
  for (const key of accountOwnedLocalKeys(uid)) assert.equal(store.getItem(key), null)
  assert.equal(store.getItem('tornado-portable-legacy-owner-v1'), null)
  assert.equal(store.getItem('tornado-device-config-v1'), JSON.stringify({ installationId: 'device-123' }))
  assert.equal(store.getItem('unrelated'), 'keep')
})
