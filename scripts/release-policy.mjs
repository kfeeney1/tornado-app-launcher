export function parseSemver(value) {
  if (typeof value !== 'string') return null
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(value)
  if (!match) return null
  const prerelease = match[4] ? match[4].split('.') : []
  if (prerelease.some(part => /^\d+$/.test(part) && part.length > 1 && part.startsWith('0'))) return null
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), prerelease }
}

function compareIdentifier(left, right) {
  const leftNumeric = /^\d+$/.test(left)
  const rightNumeric = /^\d+$/.test(right)
  if (leftNumeric && rightNumeric) return Number(left) - Number(right)
  if (leftNumeric) return -1
  if (rightNumeric) return 1
  return left.localeCompare(right)
}

export function compareSemver(leftValue, rightValue) {
  const left = parseSemver(leftValue)
  const right = parseSemver(rightValue)
  if (!left || !right) throw new Error('Malformed semantic version')
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) return left[key] - right[key]
  }
  if (!left.prerelease.length && !right.prerelease.length) return 0
  if (!left.prerelease.length) return 1
  if (!right.prerelease.length) return -1
  const length = Math.max(left.prerelease.length, right.prerelease.length)
  for (let index = 0; index < length; index += 1) {
    if (left.prerelease[index] === undefined) return -1
    if (right.prerelease[index] === undefined) return 1
    const compared = compareIdentifier(left.prerelease[index], right.prerelease[index])
    if (compared !== 0) return compared
  }
  return 0
}

export function evaluateUpdate({ currentVersion, candidateVersion, channel = 'stable' }) {
  const current = parseSemver(currentVersion)
  const candidate = parseSemver(candidateVersion)
  if (!current || !candidate) return { accepted: false, reason: 'malformed-version' }
  if (channel !== 'stable' && channel !== 'preview') return { accepted: false, reason: 'unsupported-channel' }
  if (channel === 'stable' && candidate.prerelease.length) return { accepted: false, reason: 'prerelease-blocked' }
  const comparison = compareSemver(candidateVersion, currentVersion)
  if (comparison === 0) return { accepted: false, reason: 'same-version' }
  if (comparison < 0) return { accepted: false, reason: 'downgrade-blocked' }
  return { accepted: true, reason: 'newer-version' }
}

export function isTrustedWindowsArtifact(filename, version) {
  if (!parseSemver(version) || typeof filename !== 'string') return false
  return filename === `Tornado-Setup-${version}.exe`
}
