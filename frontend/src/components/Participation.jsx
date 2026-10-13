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
    <section className="panel overflow-hidden" aria-labelledby="participation-title">
      <div className="panel-head items-center">
        <h2 id="participation-title" className="panel-title">Participation</h2>
        <button className="btn-quiet" onClick={rows.reload} disabled={rows.loading}>
          {rows.loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {rows.loading ? (
        <div className="space-y-3 p-5" aria-hidden>
          <div className="skeleton h-10 w-40" />
          <div className="skeleton h-40" />
        </div>
      ) : rows.error ? (
        <p role="alert" className="field-error px-5 py-4">Can’t load participation. Try Refresh.</p>
      ) : data.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">No players yet. Add some under Players.</p>
      ) : (
        <>
          <div className="flex items-baseline gap-3 px-5 pb-1 pt-4">
            <span className="num text-5xl leading-none">{activeThisWeek}</span>
            <span className="text-sm text-muted">
              of {data.length} played in the last 7 days
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-[0.95rem]">
              <thead>
                <tr className="border-b border-ink/10 text-left text-xs text-muted">
                  <th scope="col" className="py-2 pl-5 pr-3 font-medium">Player</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Last played</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">7 days</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">30 days</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Total</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Won–lost</th>
                  <th scope="col" className="py-2 pr-5 text-right font-medium">Challenges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {data.map((r) => {
                  const idle = r.matches_30d === 0
                  return (
                    <tr key={r.player_id} className={idle ? 'text-muted' : ''}>
                      <td className="py-2.5 pl-5 pr-3 font-semibold text-ink">
                        {r.name}
                        {!r.active && <span className="ml-2 text-xs font-medium text-muted">Inactive</span>}
                      </td>
                      <td className="py-2.5 pr-3">
                        {relTime(r.last_played)}
                        {idle && <span className="ml-2 text-xs font-semibold text-ball-dark">Idle</span>}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{r.matches_7d}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{r.matches_30d}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{r.matches_played}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">
                        {r.wins}–{r.losses}
                      </td>
                      <td className="py-2.5 pr-5 text-right tabular-nums">{r.challenges_made}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
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
