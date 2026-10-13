import { api } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import RecordMatch from './RecordMatch.jsx'
import ManagePlayers from './ManagePlayers.jsx'
import Participation from './Participation.jsx'

export default function AdminPanel({ slug, pin }) {
  const players = useApi(() => api.listPlayers(slug, pin), [slug, pin])
  const requests = useApi(() => api.getMatchRequests(slug), [slug])

  const refreshAll = () => {
    players.reload()
    requests.reload()
  }

  async function markCompleted(id) {
    await api.updateMatchRequest(slug, pin, id, { status: 'completed' })
    requests.reload()
  }

  const list = players.data || []
  const open = requests.data || []

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-7">
      <div className="space-y-5 lg:space-y-7">
        <RecordMatch slug={slug} pin={pin} players={list} onRecorded={refreshAll} />

        <section className="panel overflow-hidden" aria-labelledby="pending-title">
          <div className="panel-head">
            <h2 id="pending-title" className="panel-title">Open challenges</h2>
            {open.length > 0 && <span className="text-sm text-muted">{open.length} open</span>}
          </div>
          {open.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">No open challenges right now.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {open.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[0.95rem]">
                  <span className="min-w-0">
                    <span className="font-semibold">{r.challenger_name}</span>
                    <span className="condensed mx-1.5 font-bold text-ball-dark">v</span>
                    <span className="font-semibold">{r.opponent_name}</span>
                    {r.message && <span className="block truncate text-sm text-muted">“{r.message}”</span>}
                  </span>
                  <button className="btn-ghost min-h-[2.25rem] shrink-0 px-3 text-sm" onClick={() => markCompleted(r.id)}>
                    Mark played
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ManagePlayers slug={slug} pin={pin} players={list} onChange={players.reload} />

      <div className="lg:col-span-2">
        <Participation slug={slug} pin={pin} />
      </div>
    </div>
  )
}
