import { useState } from 'react'
import { Link } from 'react-router-dom'
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
      <div className="panel animate-slide-up p-6" role="status">
        <p className="condensed text-3xl font-black">
          {nameOf(challenger)} <span className="text-ball-dark">v</span> {nameOf(opponent)}
        </p>
        <p className="mt-2 font-semibold">Challenge posted</p>
        <p className="mt-0.5 text-sm text-muted">It’s on the ladder page under open challenges.</p>
        <Link to={`/${slug}`} className="btn-ghost mt-5">Back to the ladder</Link>
      </div>
    )
  }

  const sameName = challenger && challenger === opponent
  const ready = challenger && opponent && !sameName

  return (
    <form onSubmit={submit} className="panel overflow-hidden">
      <div className="panel-head">
        <h2 className="panel-title">Who’s playing</h2>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div>
            <label className="label" htmlFor="challenger">Challenger</label>
            <select id="challenger" className="input" value={challenger} onChange={(e) => setChallenger(e.target.value)} required>
              <option value="">Choose a player</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <span aria-hidden className="condensed hidden pb-2 text-center text-2xl font-black text-ball-dark sm:block">
            v
          </span>
          <div>
            <label className="label" htmlFor="opponent">Opponent</label>
            <select id="opponent" className="input" value={opponent} onChange={(e) => setOpponent(e.target.value)} required>
              <option value="">Choose a player</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {sameName && <p className="field-error">Pick two different players.</p>}

        <div>
          <label className="label" htmlFor="message">Message <span className="font-normal text-muted">(optional)</span></label>
          <input
            id="message"
            className="input"
            maxLength={280}
            placeholder="Best of 3 on Tuesday?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="when">Proposed time <span className="font-normal text-muted">(optional)</span></label>
          <input
            id="when"
            type="datetime-local"
            className="input"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
          />
        </div>

        {status instanceof Error && <p role="alert" className="field-error">{status.message}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 bg-ink/[0.02] px-5 py-4 sm:px-6">
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={status === 'saving' || !ready}>
          {status === 'saving' ? 'Posting…' : 'Post challenge'}
        </button>
        {ready && (
          <span className="animate-slide-up text-sm text-muted">
            {nameOf(challenger)} v {nameOf(opponent)}
          </span>
        )}
      </div>
    </form>
  )
}
