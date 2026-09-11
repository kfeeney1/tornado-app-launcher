export default function Brand({ compact = false }) {
  return <div className="brand" aria-label="Tornado"><span className="tornado-mark" aria-hidden="true">◒</span>{!compact && <strong>TORNADO</strong>}</div>
}
