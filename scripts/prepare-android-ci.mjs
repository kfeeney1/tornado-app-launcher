import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

if (!existsSync('android')) {
  execFileSync('npx', ['cap', 'add', 'android'], { stdio: 'inherit', shell: process.platform === 'win32' })
}
execFileSync('npx', ['cap', 'sync', 'android'], { stdio: 'inherit', shell: process.platform === 'win32' })
