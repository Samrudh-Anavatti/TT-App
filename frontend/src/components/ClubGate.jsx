import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KNOWN_CLUBS } from '../api.js'
import { tryUnlockClub } from '../clubAccess.js'
import Shell from './Shell.jsx'

// Soft club-entry gate: prompts for the club PIN before showing the board.
// This is NOT the admin PIN — see clubAccess.js. Calls onUnlock() once verified.
export default function ClubGate({ slug, onUnlock }) {
  const known = KNOWN_CLUBS.find((c) => c.slug === slug)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (tryUnlockClub(slug, pin)) {
      onUnlock()
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <Shell subtitle="Club access">
      <div className="mx-auto max-w-sm animate-slide-up">
        <form onSubmit={submit} className="card space-y-4 p-6 text-center">
          <div className="text-4xl">🔒</div>
          <div>
            <h1 className="text-xl font-extrabold text-table">{known?.name || slug}</h1>
            <p className="mt-1 text-sm text-table/60">Enter the club PIN to view this board.</p>
          </div>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            className="input text-center text-lg tracking-[0.3em]"
            placeholder="••••"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setError(false)
            }}
          />
          {error && <p className="text-sm text-ball">Incorrect PIN.</p>}
          <button type="submit" className="btn-primary w-full" disabled={!pin}>
            Enter
          </button>
          <Link to="/" className="block text-sm text-table/50 transition hover:text-table">
            ← Pick a different club
          </Link>
        </form>
      </div>
    </Shell>
  )
}
