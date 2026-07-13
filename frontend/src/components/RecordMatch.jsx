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
    <section className="card p-6">
      <h2 className="flex items-center gap-2 font-extrabold tracking-tight text-table">
        <span aria-hidden>📋</span> Record Match
      </h2>
      <p className="mb-4 mt-1 text-sm text-table/55">Log a result — Elo updates automatically.</p>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div>
            <label className="label">🏆 Winner</label>
            <select className="input" value={winner} onChange={(e) => setWinner(e.target.value)} required>
              <option value="">Select…</option>
              {active.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.elo})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-center pb-1 sm:pb-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-table/5 text-[10px] font-black uppercase text-table/50">
              beat
            </span>
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

        <button type="submit" className="btn-primary" disabled={busy || !ready}>
          {busy ? 'Recording…' : 'Record Match'}
        </button>
      </form>

      {result && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 animate-slide-up">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Elo updated</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span>
              <span className="font-semibold text-table">{result.winner.name}</span>{' '}
              <span className="text-table/50">{result.winner.elo_before} → </span>
              <span className="font-bold text-emerald-600">{result.winner.elo_after}</span>{' '}
              <span className="font-mono text-xs font-bold text-emerald-600">
                (+{result.winner.elo_after - result.winner.elo_before})
              </span>
            </span>
            <span>
              <span className="font-semibold text-table">{result.loser.name}</span>{' '}
              <span className="text-table/50">{result.loser.elo_before} → </span>
              <span className="font-bold text-ball">{result.loser.elo_after}</span>{' '}
              <span className="font-mono text-xs font-bold text-ball">
                ({result.loser.elo_after - result.loser.elo_before})
              </span>
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
