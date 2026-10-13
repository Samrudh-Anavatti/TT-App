import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Shell from '../components/Shell.jsx'
import PinGate from '../components/PinGate.jsx'
import AdminPanel from '../components/AdminPanel.jsx'

export default function Admin() {
  const { slug } = useParams()
  const [pin, setPin] = useState(() => sessionStorage.getItem(`pin:${slug}`) || null)

  const lock = () => {
    sessionStorage.removeItem(`pin:${slug}`)
    setPin(null)
  }

  return (
    <Shell
      slug={slug}
      heading="Admin"
      intro={pin ? 'Record results, manage the roster and keep an eye on who’s playing.' : undefined}
      actions={pin && <button onClick={lock} className="btn-table">Lock admin</button>}
    >
      {pin ? <AdminPanel slug={slug} pin={pin} /> : <PinGate slug={slug} onUnlock={setPin} />}
    </Shell>
  )
}
