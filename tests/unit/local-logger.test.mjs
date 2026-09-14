import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createLocalLogger, sanitizeMetadata } = require('../../electron/main/logger.cjs')

test('logger redacts sensitive metadata and path-like values', () => {
  const sanitized = sanitizeMetadata({ token: 'abc', fullPath: 'C:\\Users\\Kevin\\game.exe', code: 'EFAIL', detail: 'failed at C:\\Games\\Tornado' })
  assert.equal(sanitized.token, '[redacted]')
  assert.equal(sanitized.fullPath, '[redacted]')
  assert.equal(sanitized.code, 'EFAIL')
  assert.equal(sanitized.detail.includes('C:\\'), false)
})

test('logger rotates bounded local log file', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tornado-log-'))
  const logger = createLocalLogger(directory, { maxBytes: 120 })
  for (let index = 0; index < 10; index += 1) logger.info('test-event', { index, detail: 'safe detail' })
  assert.equal(fs.existsSync(logger.file), true)
  assert.equal(fs.existsSync(`${logger.file}.1`), true)
  const latest = fs.readFileSync(logger.file, 'utf8')
  assert.match(latest, /test-event/)
  fs.rmSync(directory, { recursive: true, force: true })
})
