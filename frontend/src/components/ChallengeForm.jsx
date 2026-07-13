import { useState } from 'react'
import { api } from '../api.js'

export default function ChallengeForm({ slug, players, onDone }) {
  const [challenger, setChallenger] = useState('')
  const [opponent, setOpponent] = useState('')
  const [message, setMessage] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [status, setStatus] = useState(null) // null | 'saving' | 'done' | Error

  const nameOf = (id) => players.find((p) => p.id === id)?.name

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
  const ready = challenger && opponent && !sameName

  return (
    <form onSubmit={submit} className="card space-y-5 p-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div>
          <label className="label">Challenger</label>
          <select className="input" value={challenger} onChange={(e) => setChallenger(e.target.value)} required>
            <option value="">Select…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-center pb-1 sm:pb-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ball/10 text-xs font-black uppercase tracking-wide text-ball">
            vs
          </span>
        </div>
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

      {ready && (
        <div className="rounded-xl border border-black/5 bg-chalk/60 px-4 py-3 text-center text-sm animate-slide-up">
          <span className="font-bold text-table">{nameOf(challenger)}</span>
          <span className="mx-2" aria-hidden>🏓</span>
          <span className="font-bold text-table">{nameOf(opponent)}</span>
        </div>
      )}

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

      {sameName && <p className="text-sm text-ball">Pick two different players.</p>}
      {status instanceof Error && <p className="text-sm text-ball">{status.message}</p>}

      <button type="submit" className="btn-primary w-full" disabled={status === 'saving' || !ready}>
        {status === 'saving' ? 'Posting…' : 'Post Challenge'}
      </button>
    </form>
  )
}
