import { useState } from 'react'
import { api } from '../api.js'

// Prompts for the admin PIN and verifies it against the backend.
// Calls onUnlock(pin) once verified.
export default function PinGate({ slug, onUnlock }) {
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState(null) // null | 'checking' | Error

  async function submit(e) {
    e.preventDefault()
    setStatus('checking')
    try {
      await api.verifyPin(slug, pin)
      sessionStorage.setItem(`pin:${slug}`, pin)
      onUnlock(pin)
    } catch (err) {
      setStatus(err)
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <form onSubmit={submit} className="card space-y-4 p-6 text-center">
        <div className="text-4xl">🔒</div>
        <div>
          <h1 className="text-xl font-extrabold text-table">Admin access</h1>
          <p className="mt-1 text-sm text-table/60">Enter the club’s admin PIN.</p>
        </div>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          className="input text-center text-lg tracking-[0.3em]"
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        {status instanceof Error && (
          <p className="text-sm text-ball">
            {status.status === 401 ? 'Incorrect PIN.' : status.message}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={status === 'checking' || !pin}>
          {status === 'checking' ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}
