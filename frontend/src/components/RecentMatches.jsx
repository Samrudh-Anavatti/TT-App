function dateLabel(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function RecentMatches({ matches = [] }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-black/5 px-5 py-4">
        <h2 className="font-extrabold tracking-tight text-table">Recent Results</h2>
      </div>

      {matches.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-table/50">No matches recorded yet.</p>
      ) : (
        <ul className="divide-y divide-black/5">
          {matches.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
            >
              <div className="min-w-0">
                <span className="font-semibold text-table">{m.winner_name}</span>
                <span className="text-table/40"> beat </span>
                <span className="text-table/70">{m.loser_name}</span>
                {m.notes && (
                  <span className="ml-2 italic text-table/40">· {m.notes}</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-xs font-semibold">
                  <span className="text-emerald-600">+{m.elo_change}</span>
                  <span className="text-table/30"> / </span>
                  <span className="text-ball">-{m.elo_change}</span>
                </span>
                <span className="w-12 text-right text-xs text-table/40">
                  {dateLabel(m.played_at)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
