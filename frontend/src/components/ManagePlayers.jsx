import { useState } from 'react'
import { api } from '../api.js'

export default function ManagePlayers({ slug, pin, players, onChange }) {
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState(null)

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
      await api.addPlayer(slug, pin, { name: newName.trim() })
      setNewName('')
    })
  }

  const saveEdit = (id) =>
    run(async () => {
      await api.updatePlayer(slug, pin, id, { name: editName.trim() })
      setEditingId(null)
    })

  return (
    <section className="card p-6">
      <h2 className="mb-4 font-extrabold tracking-tight text-table">Manage Players</h2>

      <form onSubmit={addPlayer} className="mb-4 flex gap-2">
        <input
          className="input"
          placeholder="New player name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={busy || !newName.trim()}>
          + Add
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-ball">{error.message}</p>}

      <ul className="divide-y divide-black/5">
        {players.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2.5">
            {editingId === p.id ? (
              <>
                <input
                  className="input py-1.5"
                  value={editName}
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                />
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
                  {p.name} <span className="font-mono text-sm text-table/40">({p.elo})</span>
                </span>
                <button
                  className="text-sm font-semibold text-table/60 hover:text-table"
                  onClick={() => {
                    setEditingId(p.id)
                    setEditName(p.name)
                  }}
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
