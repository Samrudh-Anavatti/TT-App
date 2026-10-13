import { useState } from 'react'
import { api } from '../api.js'

export default function RecordMatch({ slug, pin, players, onRecorded }) {
  const [winner, setWinner] = useState('')
  const [loser, setLoser] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Unrated players can't be in a recorded match until a coach sets their rating.
  const active = players.filter((p) => p.active && !p.unrated)
  const unratedCount = players.filter((p) => p.active && p.unrated).length
  const sameName = winner && winner === loser
  const ready = winner && loser && !sameName

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await api.recordMatch(slug, pin, {
        winner_id: winner,
        loser_id: loser,
        notes: notes || null,
      })
      setResult(res)
      setNotes('')
      onRecorded?.()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel overflow-hidden" aria-labelledby="record-title">
      <div className="panel-head">
        <h2 id="record-title" className="panel-title">Record a match</h2>
        <span className="text-sm text-muted">Elo updates automatically</span>
      </div>

      <form onSubmit={submit} className="space-y-4 p-5">
        {unratedCount > 0 && (
          <p className="text-sm text-muted">
            {unratedCount} unrated player{unratedCount === 1 ? ' isn’t' : 's aren’t'} listed until they have a rating.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div>
            <label className="label" htmlFor="rm-winner">Winner</label>
            <select id="rm-winner" className="input" value={winner} onChange={(e) => setWinner(e.target.value)} required>
              <option value="">Choose a player</option>
              {active.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.elo})</option>
              ))}
            </select>
          </div>
          <span aria-hidden className="hidden pb-3 text-center text-sm text-muted sm:block">beat</span>
          <div>
            <label className="label" htmlFor="rm-loser">Loser</label>
            <select id="rm-loser" className="input" value={loser} onChange={(e) => setLoser(e.target.value)} required>
              <option value="">Choose a player</option>
              {active.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.elo})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="rm-notes">Notes <span className="font-normal text-muted">(optional)</span></label>
          <input id="rm-notes" className="input" maxLength={280} placeholder="Close game, 11–9 in the fifth" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {sameName && <p className="field-error">Winner and loser must be different players.</p>}
        {error && <p role="alert" className="field-error">{error.message}</p>}

        <button type="submit" className="btn-primary" disabled={busy || !ready}>
          {busy ? 'Recording…' : 'Record match'}
        </button>
      </form>

      {result && (
        <div role="status" className="animate-slide-up border-t border-ink/10 bg-table/[0.05] px-5 py-4">
          <div className="text-sm font-semibold">Match recorded. New ratings:</div>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              { p: result.winner, label: 'Winner' },
              { p: result.loser, label: 'Loser' },
            ].map(({ p, label }) => {
              const diff = p.elo_after - p.elo_before
              return (
                <div key={label}>
                  <dt className="text-sm text-muted">
                    {label}: <span className="font-semibold text-ink">{p.name}</span>
                  </dt>
                  <dd className="flex items-baseline gap-2">
                    <span className="text-sm text-muted tabular-nums">{p.elo_before} to</span>
                    <span className="num text-2xl">{p.elo_after}</span>
                    <span className="text-sm font-semibold tabular-nums">
                      ({diff >= 0 ? '+' : '−'}{Math.abs(diff)})
                    </span>
                  </dd>
                </div>
              )
            })}
          </dl>
        </div>
      )}
    </section>
  )
}
