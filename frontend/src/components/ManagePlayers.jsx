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
    <section className="panel overflow-hidden" aria-labelledby="players-title">
      <div className="panel-head">
        <h2 id="players-title" className="panel-title">Players</h2>
        <span className="text-sm text-muted">{players.filter((p) => p.active).length} active</span>
      </div>

      <div className="p-5">
      {needsRating.length > 0 && (
        <div className="mb-5 rounded-md border border-ball/35 bg-ball/[0.07] p-4">
          <p className="font-semibold">
            {needsRating.length} player{needsRating.length === 1 ? ' needs' : 's need'} a rating
          </p>
          <p className="mt-0.5 text-sm text-ink/75">
            Set one so they’re ranked on the ladder and can play recorded matches.
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

      <form onSubmit={addPlayer} className="space-y-2">
        <label className="label" htmlFor="new-player">Add a player</label>
        <div className="flex flex-wrap gap-2">
          <input
            id="new-player"
            className="input min-w-[8rem] flex-1"
            placeholder="Full name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            type="number"
            min={100}
            max={4000}
            className="input w-28 shrink-0"
            title="Starting Elo"
            aria-label="Starting Elo"
            placeholder={newUnrated ? '–' : 'Elo'}
            value={newUnrated ? '' : newElo}
            disabled={newUnrated}
            onChange={(e) => setNewElo(e.target.value)}
          />
          <button type="submit" className="btn-primary shrink-0" disabled={busy || !newName.trim()}>
            Add player
          </button>
        </div>
        <label className="flex min-h-[2.25rem] items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[rgb(var(--c-table))]"
            checked={newUnrated}
            onChange={(e) => setNewUnrated(e.target.checked)}
          />
          No rating yet. A coach will set it later.
        </label>
      </form>

      {error && <p role="alert" className="field-error mt-3">{error.message}</p>}
      </div>

      <ul className="divide-y divide-ink/5 border-t border-ink/10">
        {players.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-2 px-5 py-2">
            {editingId === p.id ? (
              <>
                <input
                  className="input min-h-[2.25rem] min-w-[8rem] flex-1"
                  aria-label="Player name"
                  value={editName}
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                />
                {!p.unrated && (
                  <input
                    type="number"
                    min={100}
                    max={4000}
                    className="input min-h-[2.25rem] w-24 shrink-0"
                    title="Elo"
                    aria-label="Elo"
                    value={editElo}
                    onChange={(e) => setEditElo(e.target.value)}
                  />
                )}
                <button className="btn-primary min-h-[2.25rem] px-3 text-sm" onClick={() => saveEdit(p.id)} disabled={busy}>
                  Save
                </button>
                <button className="btn-quiet" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className={`min-w-0 flex-1 ${p.active ? '' : 'text-muted'}`}>
                  <span className="font-medium">{p.name}</span>{' '}
                  <span className="text-sm tabular-nums text-muted">
                    {p.unrated ? 'unrated' : p.elo}
                    {!p.active && ', inactive'}
                  </span>
                </span>
                <button className="btn-quiet" onClick={() => startEdit(p)}>
                  Edit
                </button>
                {p.active ? (
                  <button
                    className="btn-quiet hover:text-ball-dark"
                    onClick={() => run(() => api.deactivatePlayer(slug, pin, p.id))}
                    disabled={busy}
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    className="btn-quiet text-table"
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
    <li className="flex flex-wrap items-center gap-2">
      <span className="min-w-0 basis-full truncate font-medium sm:basis-auto sm:flex-1">{player.name}</span>
      <input
        type="number"
        min={100}
        max={4000}
        aria-label={`Rating for ${player.name}`}
        className="input min-h-[2.25rem] w-24"
        value={elo}
        onChange={(e) => setElo(e.target.value)}
      />
      <button
        className="btn-primary min-h-[2.25rem] px-3 text-sm"
        disabled={busy || !elo}
        onClick={() => onSet(Number(elo))}
      >
        Set rating
      </button>
    </li>
  )
}
