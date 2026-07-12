import { useState } from 'react'
import { api } from '../api.js'

export default function ChallengeForm({ slug, players, onDone }) {
  const [challenger, setChallenger] = useState('')
  const [opponent, setOpponent] = useState('')
  const [message, setMessage] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [status, setStatus] = useState(null) // null | 'saving' | 'done' | Error

  async function submit(e) {
    e.preventDefault()
    setStatus('saving')
    try {
      await api.createMatchRequest(slug, {
        challenger_id: challenger,
        opponent_id: opponent,
        message: message || null,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      })
      setStatus('done')
      onDone?.()
    } catch (err) {
      setStatus(err)
    }
  }

  if (status === 'done') {
    return (
      <div className="card p-8 text-center animate-slide-up">
        <div className="text-4xl">🏓</div>
        <p className="mt-3 text-lg font-bold text-table">Challenge posted!</p>
        <p className="mt-1 text-sm text-table/60">It’s up on the notice board now.</p>
      </div>
    )
  }

  const sameName = challenger && challenger === opponent

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div>
          <label className="label">Challenger</label>
          <select className="input" value={challenger} onChange={(e) => setChallenger(e.target.value)} required>
            <option value="">Select…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="pb-2.5 text-center text-sm font-bold uppercase text-table/40">vs</div>
        <div>
          <label className="label">Opponent</label>
          <select className="input" value={opponent} onChange={(e) => setOpponent(e.target.value)} required>
            <option value="">Select…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Message (optional)</label>
        <input
          className="input"
          maxLength={280}
          placeholder="Best of 3 on Tuesday?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Proposed time (optional)</label>
        <input
          type="datetime-local"
          className="input"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
        />
      </div>

      {sameName && (
        <p className="text-sm text-ball">Pick two different players.</p>
      )}
      {status instanceof Error && (
        <p className="text-sm text-ball">{status.message}</p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={status === 'saving' || sameName}>
        {status === 'saving' ? 'Posting…' : 'Post Challenge'}
      </button>
    </form>
  )
}
