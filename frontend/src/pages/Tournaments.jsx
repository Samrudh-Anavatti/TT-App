import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import Shell, { SkeletonPanel } from '../components/Shell.jsx'

// Read-only helper: the admin PIN (if the admin unlocked it this session) lets
// tournament management controls appear inline. Not security — the backend
// re-checks the PIN on every mutation.
function useAdminPin(slug) {
  return sessionStorage.getItem(`pin:${slug}`) || null
}

export default function Tournaments() {
  const { slug } = useParams()
  const pin = useAdminPin(slug)
  const tournaments = useApi(() => api.getTournaments(slug), [slug])

  return (
    <Shell
      slug={slug}
      heading="Tournaments"
      intro="Run an event, feed in results as they happen, and the winner takes a rating prize."
    >
      <div className="max-w-3xl space-y-5">
        {pin && <CreateTournament slug={slug} pin={pin} onCreated={tournaments.reload} />}

        {tournaments.loading ? (
          <SkeletonPanel rows={3} title={false} />
        ) : tournaments.error ? (
          <p role="alert" className="panel px-5 py-4 text-sm font-medium text-ball-dark">
            Can’t load tournaments right now. Refresh the page to try again.
          </p>
        ) : (tournaments.data || []).length === 0 ? (
          <div className="panel px-5 py-10 text-center">
            <p className="font-semibold">No tournaments yet</p>
            <p className="mt-1 text-sm text-muted">
              {pin ? 'Create one above to get started.' : 'When the club runs one, it’ll be listed here.'}
            </p>
          </div>
        ) : (
          <ul className="panel divide-y divide-ink/5 overflow-hidden">
            {tournaments.data.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/${slug}/tournaments/${t.id}`}
                  className="group grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 transition hover:bg-ink/[0.03]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-lg font-bold group-hover:underline group-hover:underline-offset-2">{t.name}</div>
                    <div className="mt-0.5 text-sm text-muted">
                      {t.participant_count} player{t.participant_count === 1 ? '' : 's'}, winner gets +{t.rating_prize}
                      {t.status === 'completed' && t.winner_name && <>. Won by {t.winner_name}</>}
                    </div>
                  </div>
                  <StatusPill status={t.status} />
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
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${done ? 'text-muted' : 'text-table'} ${className}`}>
      <span aria-hidden className={`h-2 w-2 rounded-full ${done ? 'bg-muted/50' : 'bg-ball'}`} />
      {done ? 'Finished' : 'In progress'}
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
    <section className="panel overflow-hidden">
      <div className="panel-head">
        <h2 className="panel-title">New tournament</h2>
        <span className="text-sm text-muted">Admin</span>
      </div>
      <form onSubmit={submit} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="t-name">Name</label>
          <input
            id="t-name"
            className="input"
            maxLength={120}
            placeholder="Winter Ladder"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="t-prize">Winner prize</label>
          <input
            id="t-prize"
            className="input sm:w-28"
            type="number"
            min={0}
            max={500}
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
          {busy ? 'Creating…' : 'Create tournament'}
        </button>
      </form>
      {error && <p role="alert" className="field-error px-5 pb-4">{error.message}</p>}
    </section>
  )
}
