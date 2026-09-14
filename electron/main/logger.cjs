const fs = require('node:fs')
const path = require('node:path')

const DEFAULT_MAX_BYTES = 512 * 1024
const REDACTED_KEYS = /(token|secret|password|credential|api.?key|path|username|email)/i
const WINDOWS_PATH = /[A-Za-z]:\\[^\s"']+/g

function sanitizeValue(key, value) {
  if (REDACTED_KEYS.test(key)) return '[redacted]'
  if (value === null || value === undefined) return value ?? null
  if (typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value !== 'string') return '[unsupported]'
  return value.replace(WINDOWS_PATH, '[path]').slice(0, 160)
}

function sanitizeMetadata(metadata = {}) {
  const safe = {}
  for (const [key, value] of Object.entries(metadata)) safe[key] = sanitizeValue(key, value)
  return safe
}

function rotateIfNeeded(file, maxBytes) {
  try {
    if (fs.statSync(file).size < maxBytes) return
    const previous = `${file}.1`
    try { fs.rmSync(previous, { force: true }) } catch {}
    fs.renameSync(file, previous)
  } catch {}
}

function createLocalLogger(directory, { maxBytes = DEFAULT_MAX_BYTES } = {}) {
  fs.mkdirSync(directory, { recursive: true })
  const file = path.join(directory, 'tornado.log')

  function write(level, event, metadata) {
    try {
      rotateIfNeeded(file, maxBytes)
      const record = {
        timestamp: new Date().toISOString(),
        level,
        event: String(event).slice(0, 80),
        ...sanitizeMetadata(metadata),
      }
      fs.appendFileSync(file, `${JSON.stringify(record)}\n`, 'utf8')
    } catch {
      // Logging must never prevent Tornado from starting or operating.
    }
  }

  return {
    file,
    info: (event, metadata) => write('info', event, metadata),
    warn: (event, metadata) => write('warn', event, metadata),
    error: (event, metadata) => write('error', event, metadata),
  }
}

module.exports = { createLocalLogger, sanitizeMetadata }
