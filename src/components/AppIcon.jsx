import { useState } from 'react'

export default function AppIcon({ item }) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(item.iconUrl) && !failed

  return (
    <span className="app-icon" aria-hidden="true">
      {showImage ? (
        <img
          src={item.iconUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="app-icon-fallback">{item.glyph}</span>
      )}
    </span>
  )
}
