import { spawn } from 'node:child_process'

const host = '127.0.0.1'
const port = 5173
const rendererUrl = `http://${host}:${port}`
let shuttingDown = false

function run(command, args, options = {}) {
  return spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options })
}

async function waitForRenderer(timeoutMs = 30000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(rendererUrl)
      if (response.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error(`Vite did not become ready at ${rendererUrl}`)
}

const vite = run('npm', ['run', 'dev', '--', '--host', host, '--port', String(port), '--strictPort'])
let electron

async function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  if (electron && !electron.killed) electron.kill()
  if (!vite.killed) vite.kill()
  setTimeout(() => process.exit(code), 100)
}

process.on('SIGINT', () => void shutdown(0))
process.on('SIGTERM', () => void shutdown(0))
vite.on('exit', code => { if (!shuttingDown) void shutdown(code || 0) })

try {
  await waitForRenderer()
  electron = run('npx', ['--yes', 'electron@44.3.0', 'electron/main/index.cjs'], {
    env: { ...process.env, TORNADO_RENDERER_URL: rendererUrl },
  })
  electron.on('exit', code => { if (!shuttingDown) void shutdown(code || 0) })
} catch (error) {
  console.error(error)
  await shutdown(1)
}
