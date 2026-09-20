import { api } from '../api.js'
import { useApi } from '../hooks/useApi.js'

// Admin/coach view: who's been coming and playing. Sorted most-recently-active
// first (the backend does the sort). Players idle for 30+ days are flagged so
// coaches can chase them up.
export default function Participation({ slug, pin }) {
  const rows = useApi(() => api.getParticipation(slug, pin), [slug, pin])
  const data = rows.data || []
  const activeThisWeek = data.filter((r) => r.matches_7d > 0).length

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-extrabold tracking-tight text-table">
          <span aria-hidden>📊</span> Participation
        </h2>
        <button className="btn-ghost py-1.5" onClick={rows.reload}>Refresh</button>
      </div>
      <p className="mb-4 mt-1 text-sm text-table/55">
        Who’s been coming and playing.{' '}
        {!rows.loading && (
          <span className="font-semibold text-table">{activeThisWeek}</span>
        )}
        {!rows.loading && ' played in the last 7 days.'}
      </p>

      {rows.loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-table/5" />
      ) : rows.error ? (
        <p className="text-sm text-ball">Couldn’t load participation.</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-table/50">No players yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-table/40">
                <th className="py-1.5 pr-3">Player</th>
                <th className="py-1.5 pr-3">Last played</th>
                <th className="py-1.5 pr-3 text-center">7d</th>
                <th className="py-1.5 pr-3 text-center">30d</th>
                <th className="py-1.5 pr-3 text-center">Total</th>
                <th className="py-1.5 pr-3 text-center">W–L</th>
                <th className="py-1.5 text-center" title="Challenges raised">Challenges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {data.map((r) => {
                const idle = r.matches_30d === 0
                return (
                  <tr key={r.player_id} className={idle ? 'text-table/45' : ''}>
                    <td className="py-2 pr-3 font-semibold text-table">
                      {r.name}
                      {!r.active && (
                        <span className="ml-1.5 rounded bg-table/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-table/50">
                          inactive
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <span className={idle ? 'text-ball/70' : 'text-table/70'}>
                        {relTime(r.last_played)}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-center font-mono">{r.matches_7d}</td>
                    <td className="py-2 pr-3 text-center font-mono">{r.matches_30d}</td>
                    <td className="py-2 pr-3 text-center font-mono">{r.matches_played}</td>
                    <td className="py-2 pr-3 text-center font-mono">
                      <span className="text-emerald-600">{r.wins}</span>
                      <span className="text-table/30">–</span>
                      <span className="text-ball">{r.losses}</span>
                    </td>
                    <td className="py-2 text-center font-mono">{r.challenges_made}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function relTime(iso) {
  if (!iso) return 'never'
  const then = new Date(iso)
  const days = Math.floor((Date.now() - then.getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return then.toLocaleDateString()
}
