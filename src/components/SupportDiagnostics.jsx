import { useMemo, useState } from 'react'
import packageInfo from '../../package.json'
import { DEVICE_CONFIG_SCHEMA_VERSION, PORTABLE_CONFIG_SCHEMA_VERSION } from '../config/localConfig.js'
import { getStartupRecoverySummary } from '../config/startupRecovery.js'
import { isDesktop } from '../platform/index.js'

function buildDiagnostics(syncStatus) {
  const recovery = getStartupRecoverySummary()
  return [
    `Tornado version: ${packageInfo.version}`,
    `Client: ${isDesktop() ? 'Windows desktop' : 'Web'}`,
    `Portable config schema: ${PORTABLE_CONFIG_SCHEMA_VERSION}`,
    `Device config schema: ${DEVICE_CONFIG_SCHEMA_VERSION}`,
    `Portable startup recovery: ${recovery.portable}`,
    `Device startup recovery: ${recovery.device}`,
    `Sync status: ${syncStatus || 'unknown'}`,
    'Update channel: stable',
    'Update mechanism: manual GitHub Releases',
  ].join('\n')
}

export default function SupportDiagnostics({ syncStatus }) {
  const diagnostics = useMemo(() => buildDiagnostics(syncStatus), [syncStatus])
  const [copyState, setCopyState] = useState('idle')

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(diagnostics)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div>
      <p className="field-help">Support diagnostics include version, client type, configuration schema versions, startup recovery state, sync state and update mode only. They do not include account tokens, Firebase credentials, usernames or local executable paths.</p>
      <pre aria-label="Support diagnostics">{diagnostics}</pre>
      <button onClick={copyDiagnostics}>Copy diagnostics</button>
      {copyState === 'copied' && <span role="status"> Diagnostics copied.</span>}
      {copyState === 'failed' && <span role="status"> Copy failed. Select the diagnostics text manually.</span>}
    </div>
  )
}
