import { api } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import RecordMatch from './RecordMatch.jsx'
import ManagePlayers from './ManagePlayers.jsx'

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

  return (
    <div className="space-y-5">
      <RecordMatch slug={slug} pin={pin} players={list} onRecorded={refreshAll} />

      <ManagePlayers slug={slug} pin={pin} players={list} onChange={players.reload} />

      <section className="card p-6">
        <h2 className="mb-4 font-extrabold tracking-tight text-table">Pending Requests</h2>
        {(requests.data || []).length === 0 ? (
          <p className="text-sm text-table/50">No open challenges.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {requests.data.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="text-table">
                  <span className="font-semibold">{r.challenger_name}</span>
                  <span className="text-table/40"> → </span>
                  <span className="font-semibold">{r.opponent_name}</span>
                  {r.message && <span className="ml-2 italic text-table/40">“{r.message}”</span>}
                </span>
                <button className="btn-ghost py-1.5" onClick={() => markCompleted(r.id)}>
                  Mark Completed
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
