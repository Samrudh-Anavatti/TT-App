import { Link } from 'react-router-dom'

function whenLabel(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function NoticeBoard({ slug, requests = [] }) {
  return (
    <section className="panel flex flex-col overflow-hidden" aria-labelledby="challenges-title">
      <div className="panel-head">
        <h2 id="challenges-title" className="panel-title">Open challenges</h2>
        {requests.length > 0 && <span className="text-sm text-muted">{requests.length} open</span>}
      </div>

      {requests.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">
          No one’s been called out yet. Pick an opponent and post the first challenge.
        </p>
      ) : (
        <ul className="divide-y divide-ink/5">
          {requests.map((r) => (
            <li key={r.id} className="px-5 py-3.5">
              <div className="flex flex-wrap items-baseline gap-x-2 font-semibold">
                <span>{r.challenger_name}</span>
                <span className="condensed text-sm font-bold text-ball-dark">v</span>
                <span>{r.opponent_name}</span>
              </div>
              {r.scheduled_for && (
                <div className="mt-0.5 text-sm text-muted">{whenLabel(r.scheduled_for)}</div>
              )}
              {r.message && <p className="mt-1 text-sm text-ink/75">“{r.message}”</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-ink/10 p-4">
        <Link to={`/${slug}/challenge`} className="btn-primary w-full">
          Challenge someone
        </Link>
      </div>
    </section>
  )
}
