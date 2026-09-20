import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, getClubMeta } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import Shell from '../components/Shell.jsx'
import ClubBadge from '../components/ClubBadge.jsx'

// Read-only helper: the admin PIN (if the admin unlocked it this session) lets
// tournament management controls appear inline. Not security — the backend
// re-checks the PIN on every mutation.
function useAdminPin(slug) {
  return sessionStorage.getItem(`pin:${slug}`) || null
}

export default function Tournaments() {
  const { slug } = useParams()
  const known = getClubMeta(slug)
  const pin = useAdminPin(slug)
  const tournaments = useApi(() => api.getTournaments(slug), [slug])

  return (
    <Shell
      title={known?.name || slug}
      subtitle="Tournaments"
      badge={known && <ClubBadge club={known} />}
      right={
        <Link to={`/${slug}`} className="btn-ghost !bg-white/10 !text-white hover:!bg-white/20">
          ← Back
        </Link>
      }
    >
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-table">Tournaments</h1>
            <p className="mt-1 text-sm text-table/55">
              Run an event, feed in results as they happen, and the winner takes a rating prize.
            </p>
          </div>
        </div>

        {pin && <CreateTournament slug={slug} pin={pin} onCreated={tournaments.reload} />}

        {tournaments.loading ? (
          <div className="card h-32 animate-pulse" />
        ) : tournaments.error ? (
          <p className="text-sm text-ball">Couldn’t load tournaments.</p>
        ) : (tournaments.data || []).length === 0 ? (
          <div className="card p-8 text-center text-table/55">
            No tournaments yet.{pin ? ' Create one above.' : ' Check back soon.'}
          </div>
        ) : (
          <ul className="space-y-3">
            {tournaments.data.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/${slug}/tournaments/${t.id}`}
                  className="card group flex items-center gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span className="text-2xl" aria-hidden>🏆</span>
                  <div className="min-w-0">
                    <div className="font-bold text-table">{t.name}</div>
                    <div className="text-xs text-table/50">
                      {t.participant_count} player{t.participant_count === 1 ? '' : 's'} · prize +{t.rating_prize}
                      {t.status === 'completed' && t.winner_name && (
                        <> · 🥇 {t.winner_name}</>
                      )}
                    </div>
                  </div>
                  <StatusPill status={t.status} className="ml-auto" />
                  <span className="text-ball transition group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  )
}

function StatusPill({ status, className = '' }) {
  const done = status === 'completed'
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
        done ? 'bg-table/10 text-table/60' : 'bg-emerald-100 text-emerald-700'
      } ${className}`}
    >
      {done ? 'Completed' : 'Active'}
    </span>
  )
}

function CreateTournament({ slug, pin, onCreated }) {
  const [name, setName] = useState('')
  const [prize, setPrize] = useState(25)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.createTournament(slug, pin, { name: name.trim(), rating_prize: Number(prize) })
      setName('')
      setPrize(25)
      onCreated?.()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card p-6">
      <h2 className="flex items-center gap-2 font-extrabold tracking-tight text-table">
        <span aria-hidden>➕</span> New tournament
      </h2>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            maxLength={120}
            placeholder="Winter Ladder"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Winner prize</label>
          <input
            className="input w-28"
            type="number"
            min={0}
            max={500}
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
          {busy ? 'Creating…' : 'Create'}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-ball">{error.message}</p>}
    </section>
  )
}
