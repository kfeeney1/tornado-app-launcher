import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const register = await readFile(new URL('../../docs/windows-deferred-acceptance.md', import.meta.url), 'utf8')

test('deferred Windows register carries launcher, parity and desktop checks to release gate', () => {
  assert.match(register, /A1:/)
  assert.match(register, /same account signs into packaged Windows and Web/i)
  assert.match(register, /second launch restores\/focuses/i)
  assert.match(register, /Phase E cannot be declared feature-complete\/release-ready/i)
  assert.match(register, /no production candidate may be promoted/i)
})
