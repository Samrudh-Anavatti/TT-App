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
    <section className="card flex flex-col overflow-hidden">
      <div className="border-b border-black/5 px-5 py-4">
        <h2 className="font-extrabold tracking-tight text-table">Notice Board</h2>
      </div>

      <div className="flex-1 space-y-3 px-5 py-4">
        {requests.length === 0 ? (
          <p className="py-6 text-center text-sm text-table/50">
            No open challenges. Be the first to call someone out! 🏓
          </p>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-black/5 bg-chalk/60 px-4 py-3 animate-slide-up"
            >
              <div className="flex items-center gap-2 font-semibold text-table">
                <span>🏓</span>
                <span>
                  {r.challenger_name} <span className="text-table/40">vs</span>{' '}
                  {r.opponent_name}
                </span>
              </div>
              {r.scheduled_for && (
                <div className="mt-0.5 text-xs font-medium text-ball">
                  {whenLabel(r.scheduled_for)}
                </div>
              )}
              {r.message && (
                <p className="mt-1 text-sm italic text-table/60">“{r.message}”</p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-black/5 p-4">
        <Link to={`/${slug}/challenge`} className="btn-primary w-full">
          + Challenge Someone
        </Link>
      </div>
    </section>
  )
}
