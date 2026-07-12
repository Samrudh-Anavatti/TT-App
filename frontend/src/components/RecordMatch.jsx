import { useState } from 'react'
import { api } from '../api.js'

export default function RecordMatch({ slug, pin, players, onRecorded }) {
  const [winner, setWinner] = useState('')
  const [loser, setLoser] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const active = players.filter((p) => p.active)
  const sameName = winner && winner === loser

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
    <section className="card p-6">
      <h2 className="mb-4 font-extrabold tracking-tight text-table">Record Match</h2>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div>
            <label className="label">Winner</label>
            <select className="input" value={winner} onChange={(e) => setWinner(e.target.value)} required>
              <option value="">Select…</option>
              {active.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.elo})</option>
              ))}
            </select>
          </div>
          <div className="pb-2.5 text-center text-sm font-bold uppercase text-table/40">
            defeated
          </div>
          <div>
            <label className="label">Loser</label>
            <select className="input" value={loser} onChange={(e) => setLoser(e.target.value)} required>
              <option value="">Select…</option>
              {active.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.elo})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <input className="input" maxLength={280} placeholder="close game" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {sameName && <p className="text-sm text-ball">Winner and loser must differ.</p>}
        {error && <p className="text-sm text-ball">{error.message}</p>}

        <button type="submit" className="btn-primary" disabled={busy || sameName}>
          {busy ? 'Recording…' : 'Record Match'}
        </button>
      </form>

      {result && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm animate-slide-up">
          <span className="font-semibold text-table">{result.winner.name}</span>{' '}
          {result.winner.elo_before} → <span className="font-bold text-emerald-600">{result.winner.elo_after}</span>
          <span className="mx-2 text-table/30">·</span>
          <span className="font-semibold text-table">{result.loser.name}</span>{' '}
          {result.loser.elo_before} → <span className="font-bold text-ball">{result.loser.elo_after}</span>
        </div>
      )}
    </section>
  )
}
