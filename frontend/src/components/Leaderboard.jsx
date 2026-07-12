const RANK_STYLES = {
  1: 'bg-ball text-white',
  2: 'bg-table/70 text-white',
  3: 'bg-table/40 text-white',
}

function winRate(p) {
  if (!p.matches_played) return '—'
  return `${Math.round((p.wins / p.matches_played) * 100)}%`
}

export default function Leaderboard({ players = [] }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
        <h2 className="font-extrabold tracking-tight text-table">Leaderboard</h2>
        <span className="text-xs font-semibold uppercase tracking-wide text-table/40">
          {players.length} players
        </span>
      </div>

      {players.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-table/50">No players yet.</p>
      ) : (
        <ul className="divide-y divide-black/5">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 px-5 py-3 transition hover:bg-chalk/60"
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                  RANK_STYLES[p.rank] || 'bg-table/5 text-table/60'
                }`}
              >
                {p.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-table">{p.name}</div>
                <div className="text-xs text-table/45">
                  {p.wins}W · {p.losses}L · {winRate(p)} win rate
                </div>
              </div>
              <span className="font-mono text-lg font-bold tabular-nums text-table">
                {p.elo}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
