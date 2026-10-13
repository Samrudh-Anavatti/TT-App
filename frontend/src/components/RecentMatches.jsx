function dateLabel(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function RecentMatches({ matches = [] }) {
  return (
    <section className="panel overflow-hidden" aria-labelledby="results-title">
      <div className="panel-head">
        <h2 id="results-title" className="panel-title">Recent results</h2>
        {matches.length > 0 && <span className="text-sm text-muted">Points swing</span>}
      </div>

      {matches.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">No results yet. They’ll appear here once an admin records a match.</p>
      ) : (
        <ul className="divide-y divide-ink/5">
          {matches.map((m) => (
            <li key={m.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 px-5 py-3">
              <div className="min-w-0 text-[0.95rem]">
                <span className="font-semibold">{m.winner_name}</span>
                <span className="text-muted"> beat </span>
                <span>{m.loser_name}</span>
                <div className="text-[0.82rem] text-muted">
                  {dateLabel(m.played_at)}
                  {m.notes && <span className="italic">, {m.notes}</span>}
                </div>
              </div>
              <span className="num text-xl" title={`Winner +${m.elo_change}, loser −${m.elo_change}`}>
                ±{m.elo_change}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
