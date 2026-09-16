import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const pkg = JSON.parse(await readFile('package.json', 'utf8'))
const config = JSON.parse(await readFile('capacitor.config.json', 'utf8'))
assert.equal(config.appName, 'Tornado')
assert.equal(config.webDir, 'dist')
assert.ok(config.appId)
assert.equal(pkg.dependencies['@capacitor/core'], pkg.dependencies['@capacitor/android'])
assert.equal(pkg.dependencies['@capacitor/core'], pkg.devDependencies['@capacitor/cli'])
console.log(`Android foundation configured for ${config.appId} with Capacitor ${pkg.dependencies['@capacitor/core']}`)
