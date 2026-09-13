import { useEffect, useState } from 'react'
import { useDevices } from './DeviceContext.jsx'
import { formatLastActive } from './deviceTypes.js'

export default function DevicesPanel() {
  const { deviceId, devices, isLoading, error, refreshDevices, removeDevice } = useDevices()
  const [removing, setRemoving] = useState('')

  useEffect(() => { refreshDevices().catch(() => {}) }, [refreshDevices])

  const handleRemove = async device => {
    const ok = window.confirm(`Remove ${device.deviceName} from your Tornado device list?`)
    if (!ok) return
    setRemoving(device.deviceId)
    await removeDevice(device.deviceId)
    setRemoving('')
  }

  return <div className="panel" aria-labelledby="devices-heading">
    <h2 id="devices-heading">Devices</h2>
    <p className="field-help">This is a private list of Tornado installations used with your account. Removing an entry from this list does not revoke an authentication session.</p>
    {isLoading && <p role="status">Loading devices…</p>}
    {error && <p role="status" className="field-help">{error}</p>}
    {!isLoading && !error && devices.length === 0 && <p>No registered devices yet.</p>}
    <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
      {devices.map(device => {
        const current = device.deviceId === deviceId
        return <article key={device.deviceId} aria-label={`${device.deviceName}${current ? ', this device' : ''}`} style={{ border: '1px solid rgba(148,163,184,.25)', borderRadius: 14, padding: 14 }}>
          <strong>{device.deviceName}</strong>{current && <span> · This device</span>}
          <div className="field-help">{current ? 'Active now' : formatLastActive(device.lastSeenAt)}</div>
          <div className="field-help">{device.platform} · Tornado {device.appVersion ?? 'version unavailable'}</div>
          {!current && <button className="danger-action" disabled={removing === device.deviceId} aria-label={`Remove ${device.deviceName} from device list`} onClick={() => handleRemove(device)}>{removing === device.deviceId ? 'Removing…' : 'Remove from device list'}</button>}
        </article>
      })}
    </div>
  </div>
}
