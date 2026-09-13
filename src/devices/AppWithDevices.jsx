import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import App from '../App.jsx'
import DevicesPanel from './DevicesPanel.jsx'

function findProfileSection() {
  const headings = [...document.querySelectorAll('main h1')]
  const profileHeading = headings.find(heading => heading.textContent?.trim() === 'Profile')
  return profileHeading?.closest('section') ?? null
}

export default function AppWithDevices() {
  const [profileSection, setProfileSection] = useState(null)

  useEffect(() => {
    const update = () => setProfileSection(findProfileSection())
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return <>
    <App />
    {profileSection ? createPortal(<DevicesPanel />, profileSection) : null}
  </>
}
