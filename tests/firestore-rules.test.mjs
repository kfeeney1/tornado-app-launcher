import assert from 'node:assert/strict'
import test from 'node:test'

const projectId = process.env.GCLOUD_PROJECT || 'demo-tornado-app-launcher'
const authBase = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099'
const firestoreBase = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'

async function createUser(email) {
  const response = await fetch(`http://${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'Tornado123!', returnSecureToken: true }),
  })
  const body = await response.text()
  assert.equal(response.ok, true, body)
  return JSON.parse(body)
}

function documentUrl(path) {
  return `http://${firestoreBase}/v1/projects/${projectId}/databases/(default)/documents/${path}`
}

async function request(path, { token, method = 'GET', fields } = {}) {
  return fetch(documentUrl(path), {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(fields ? { 'content-type': 'application/json' } : {}),
    },
    body: fields ? JSON.stringify({ fields }) : undefined,
  })
}

const stringValue = value => ({ stringValue: value })
const integerValue = value => ({ integerValue: String(value) })
const timestampValue = value => ({ timestampValue: value })
const nullValue = { nullValue: null }

function profileFields(email) {
  return {
    schemaVersion: integerValue(1),
    email: stringValue(email),
    displayName: nullValue,
    createdAt: timestampValue('2026-09-12T10:00:00Z'),
    updatedAt: timestampValue('2026-09-12T10:00:00Z'),
  }
}

function launcherFields() {
  return {
    schemaVersion: integerValue(1),
    selectedItemIds: { arrayValue: { values: [stringValue('minecraft'), stringValue('spotify')] } },
  }
}

test('users can access only their own profile and config documents', async () => {
  const userA = await createUser(`user-a-${Date.now()}@tornado.test`)
  const userB = await createUser(`user-b-${Date.now()}@tornado.test`)
  const userAPath = `users/${userA.localId}`
  const userBPath = `users/${userB.localId}`

  let response = await request(userAPath, { token: userA.idToken, method: 'PATCH', fields: profileFields(userA.email) })
  assert.equal(response.ok, true, await response.text())

  response = await request(userAPath, { token: userA.idToken })
  assert.equal(response.ok, true, await response.text())

  response = await request(userAPath, { token: userB.idToken })
  assert.equal(response.status, 403)

  response = await request(userAPath)
  assert.equal(response.status, 403)

  response = await request(userBPath, { token: userA.idToken, method: 'PATCH', fields: profileFields(userB.email) })
  assert.equal(response.status, 403)

  const configPath = `${userAPath}/config/launcher`
  response = await request(configPath, { token: userA.idToken, method: 'PATCH', fields: launcherFields() })
  assert.equal(response.ok, true, await response.text())

  response = await request(configPath, { token: userA.idToken })
  assert.equal(response.ok, true, await response.text())

  response = await request(configPath, { token: userB.idToken })
  assert.equal(response.status, 403)

  response = await request(configPath)
  assert.equal(response.status, 403)

  response = await request(`${userBPath}/config/launcher`, { token: userA.idToken, method: 'PATCH', fields: launcherFields() })
  assert.equal(response.status, 403)
})
