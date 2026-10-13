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
    <form onSubmit={submit} className="panel max-w-md overflow-hidden">
      <div className="panel-head">
        <h2 className="panel-title">Unlock admin</h2>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <p className="text-sm text-muted">Club coaches and organisers only. Enter the admin PIN to continue.</p>
        <div>
          <label className="label" htmlFor="pin">Admin PIN</label>
          <input
            id="pin"
            type="password"
            inputMode="text"
            autoComplete="current-password"
            autoFocus
            className="input text-lg tracking-[0.25em]"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </div>
        {status instanceof Error && (
          <p role="alert" className="field-error">
            {status.status === 401 ? 'That PIN isn’t right. Check it and try again.' : status.message}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={status === 'checking' || !pin}>
          {status === 'checking' ? 'Checking…' : 'Unlock'}
        </button>
      </div>
    </form>
  )
}
