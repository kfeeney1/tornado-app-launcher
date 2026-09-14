import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { isTrustedWindowsArtifact, parseSemver } from './release-policy.mjs'

const version = process.env.TORNADO_RELEASE_VERSION
const commit = process.env.TORNADO_RELEASE_SHA
const tag = process.env.TORNADO_RELEASE_TAG || (version ? `v${version}` : '')
const channel = process.env.TORNADO_RELEASE_CHANNEL || 'stable'
const signed = process.env.TORNADO_RELEASE_SIGNED === 'true'
const installerPath = process.env.TORNADO_RELEASE_INSTALLER

if (!parseSemver(version)) throw new Error(`Invalid release version: ${version}`)
if (!/^[0-9a-f]{40}$/i.test(commit || '')) throw new Error('TORNADO_RELEASE_SHA must be a full Git commit SHA')
if (tag !== `v${version}`) throw new Error(`Release tag ${tag} does not match version ${version}`)
if (channel !== 'stable') throw new Error(`Unsupported production release channel: ${channel}`)
if (!installerPath || !fs.existsSync(installerPath)) throw new Error('Release installer is missing')
const filename = path.basename(installerPath)
if (!isTrustedWindowsArtifact(filename, version)) throw new Error(`Unexpected release artifact: ${filename}`)

const bytes = fs.readFileSync(installerPath)
const sha256 = crypto.createHash('sha256').update(bytes).digest('hex')
const manifest = {
  schemaVersion: 1,
  product: 'Tornado',
  platform: 'windows',
  channel,
  version,
  tag,
  commit,
  artifact: filename,
  sha256,
  signed,
  buildState: 'release-candidate',
}

const output = path.join(path.dirname(installerPath), 'release-manifest.json')
fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
console.log(`Release manifest written to ${output}`)
