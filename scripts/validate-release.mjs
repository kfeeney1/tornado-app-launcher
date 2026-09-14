import fs from 'node:fs'

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const builder = fs.readFileSync(new URL('../electron-builder.yml', import.meta.url), 'utf8')

if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) throw new Error(`Invalid Tornado version: ${pkg.version}`)
if (pkg.productName !== 'Tornado') throw new Error('package.json productName must remain Tornado')
if (!builder.includes('appId: ie.tornado.launcher')) throw new Error('Unexpected Windows appId')
if (!builder.includes('productName: Tornado')) throw new Error('Unexpected Windows product name')
if (!builder.includes('target: nsis')) throw new Error('Phase 8 primary Windows target must be NSIS')
if (!builder.includes('artifactName: Tornado-Setup-${version}.${ext}')) throw new Error('Unexpected release artifact naming')

const expected = process.env.TORNADO_RELEASE_VERSION
if (expected && pkg.version !== expected) throw new Error(`Requested release ${expected} does not match package version ${pkg.version}`)

if (process.env.REQUIRE_FIREBASE_CONFIG === 'true') {
  const names = ['VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_APP_ID']
  const missing = names.filter(name => !process.env[name])
  if (missing.length) throw new Error(`Missing required desktop Firebase build configuration: ${missing.join(', ')}`)
}

console.log(`Tornado release configuration validated for ${pkg.version}`)
