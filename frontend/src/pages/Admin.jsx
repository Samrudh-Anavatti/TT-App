import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { KNOWN_CLUBS } from '../api.js'
import Shell from '../components/Shell.jsx'
import PinGate from '../components/PinGate.jsx'
import AdminPanel from '../components/AdminPanel.jsx'

export default function Admin() {
  const { slug } = useParams()
  const known = KNOWN_CLUBS.find((c) => c.slug === slug)
  const [pin, setPin] = useState(() => sessionStorage.getItem(`pin:${slug}`) || null)

  const lock = () => {
    sessionStorage.removeItem(`pin:${slug}`)
    setPin(null)
  }

  return (
    <Shell
      title={`Admin — ${known?.name || slug}`}
      subtitle={pin ? 'Signed in' : undefined}
      right={
        pin ? (
          <div className="flex gap-2">
            <button onClick={lock} className="btn-ghost !bg-white/10 !text-white hover:!bg-white/20">
              Lock
            </button>
            <Link to={`/${slug}`} className="btn-ghost !bg-white/10 !text-white hover:!bg-white/20">
              ← Back
            </Link>
          </div>
        ) : (
          <Link to={`/${slug}`} className="btn-ghost !bg-white/10 !text-white hover:!bg-white/20">
            ← Back
          </Link>
        )
      }
    >
      {pin ? (
        <AdminPanel slug={slug} pin={pin} />
      ) : (
        <PinGate slug={slug} onUnlock={setPin} />
      )}
    </Shell>
  )
}
