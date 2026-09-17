import assert from 'node:assert/strict'
import test from 'node:test'

// Keep these tests source-level so configuration validation remains testable without
// bootstrapping a browser or a native runtime.
const REQUIRED = ['apiKey', 'projectId', 'appId']

function validate(config) {
  const missing = REQUIRED.filter(field => !config?.[field]?.trim?.())
  if (missing.length) {
    const error = new Error(`firebase/configuration-missing:${missing.join(',')}`)
    error.code = 'firebase/configuration-missing'
    error.missingFields = missing
    throw error
  }
  return config
}

test('Firebase client configuration accepts the required public fields', () => {
  const config = { apiKey: 'key', projectId: 'tornado-app-launcher', appId: 'app' }
  assert.equal(validate(config), config)
})

test('Firebase client configuration reports every missing required field', () => {
  assert.throws(
    () => validate({ apiKey: 'key', projectId: '', appId: undefined }),
    error => error.code === 'firebase/configuration-missing'
      && error.missingFields.join(',') === 'projectId,appId',
  )
})
