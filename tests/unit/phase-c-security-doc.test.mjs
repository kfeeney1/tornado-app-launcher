import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const security = await readFile(new URL('../../docs/windows-phase-c-security.md', import.meta.url), 'utf8')

test('Phase C security model keeps native capabilities outside shared React', () => {
  assert.match(security, /does not receive raw Node\.js, filesystem or shell access/i)
  assert.match(security, /explicit preload\/IPC capabilities/i)
  assert.match(security, /prevents arbitrary top-level navigation/i)
  assert.match(security, /must not weaken these constraints/i)
})
