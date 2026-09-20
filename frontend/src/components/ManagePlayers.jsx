import { useState } from 'react'
import { api } from '../api.js'

export default function ManagePlayers({ slug, pin, players, onChange }) {
  const [newName, setNewName] = useState('')
  const [newElo, setNewElo] = useState('1000')
  const [newUnrated, setNewUnrated] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editElo, setEditElo] = useState('1000')
  const [error, setError] = useState(null)

  const needsRating = players.filter((p) => p.active && p.unrated)

  async function run(fn) {
    setBusy(true)
    setError(null)
    try {
      await fn()
      onChange?.()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const addPlayer = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    run(async () => {
      const body = newUnrated
        ? { name: newName.trim(), unrated: true }
        : { name: newName.trim(), elo: Number(newElo) || 1000 }
      await api.addPlayer(slug, pin, body)
      setNewName('')
      setNewElo('1000')
      setNewUnrated(false)
    })
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setEditName(p.name)
    setEditElo(String(p.elo))
  }

  // Edit only renames; for a rated player it can also adjust Elo. An unrated
  // player is rated via the nudge below, so we don't send elo here (that would
  // silently graduate them on a plain rename).
  const saveEdit = (id) => {
    const p = players.find((x) => x.id === id)
    const body = { name: editName.trim() }
    if (p && !p.unrated) body.elo = Number(editElo)
    run(async () => {
      await api.updatePlayer(slug, pin, id, body)
      setEditingId(null)
    })
  }

  return (
    <section className="card p-6">
      <h2 className="mb-4 font-extrabold tracking-tight text-table">Manage Players</h2>

      {needsRating.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800">
            ⏳ {needsRating.length} player{needsRating.length === 1 ? '' : 's'} need a rating
          </p>
          <p className="mt-0.5 text-xs text-amber-700/80">
            Set one so they’re ranked on the board and can play matches.
          </p>
          <ul className="mt-3 space-y-2">
            {needsRating.map((p) => (
              <NeedsRatingRow
                key={p.id}
                player={p}
                busy={busy}
                onSet={(elo) => run(() => api.updatePlayer(slug, pin, p.id, { elo }))}
              />
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={addPlayer} className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            className="input min-w-[8rem] flex-1"
            placeholder="New player name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            type="number"
            min={100}
            max={4000}
            className="input w-28 shrink-0 disabled:opacity-40"
            title="Starting ELO"
            placeholder={newUnrated ? '—' : 'ELO'}
            value={newUnrated ? '' : newElo}
            disabled={newUnrated}
            onChange={(e) => setNewElo(e.target.value)}
          />
          <button type="submit" className="btn-primary shrink-0" disabled={busy || !newName.trim()}>
            + Add
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-table/60">
          <input
            type="checkbox"
            checked={newUnrated}
            onChange={(e) => setNewUnrated(e.target.checked)}
          />
          No rating yet — a coach will set it later
        </label>
      </form>

      {error && <p className="mb-3 text-sm text-ball">{error.message}</p>}

      <ul className="divide-y divide-black/5">
        {players.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-2 py-2.5">
            {editingId === p.id ? (
              <>
                <input
                  className="input min-w-[8rem] flex-1 py-1.5"
                  value={editName}
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                />
                {!p.unrated && (
                  <input
                    type="number"
                    min={100}
                    max={4000}
                    className="input w-24 shrink-0 py-1.5"
                    title="ELO"
                    value={editElo}
                    onChange={(e) => setEditElo(e.target.value)}
                  />
                )}
                <button className="btn-ghost py-1.5" onClick={() => saveEdit(p.id)} disabled={busy}>
                  Save
                </button>
                <button className="btn-ghost py-1.5" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className={`flex-1 font-medium ${p.active ? 'text-table' : 'text-table/40 line-through'}`}>
                  {p.name}{' '}
                  <span className="font-mono text-sm text-table/40">
                    {p.unrated ? '(unrated)' : `(${p.elo})`}
                  </span>
                </span>
                <button
                  className="text-sm font-semibold text-table/60 hover:text-table"
                  onClick={() => startEdit(p)}
                >
                  Edit
                </button>
                {p.active ? (
                  <button
                    className="text-sm font-semibold text-ball/80 hover:text-ball"
                    onClick={() => run(() => api.deactivatePlayer(slug, pin, p.id))}
                    disabled={busy}
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                    onClick={() => run(() => api.updatePlayer(slug, pin, p.id, { active: true }))}
                    disabled={busy}
                  >
                    Reactivate
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function NeedsRatingRow({ player, onSet, busy }) {
  const [elo, setElo] = useState('1000')
  return (
    <li className="flex items-center gap-2">
      <span className="flex-1 truncate font-medium text-amber-900">{player.name}</span>
      <input
        type="number"
        min={100}
        max={4000}
        className="input w-24 py-1.5"
        value={elo}
        onChange={(e) => setElo(e.target.value)}
      />
      <button
        className="btn-primary py-1.5"
        disabled={busy || !elo}
        onClick={() => onSet(Number(elo))}
      >
        Set rating
      </button>
    </li>
  )
}
