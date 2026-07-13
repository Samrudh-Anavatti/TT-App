const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

function winRate(p) {
  if (!p.matches_played) return '—'
  return `${Math.round((p.wins / p.matches_played) * 100)}%`
}

export default function Leaderboard({ players = [] }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
        <h2 className="flex items-center gap-2 font-extrabold tracking-tight text-table">
          <span aria-hidden>🏓</span> Leaderboard
        </h2>
        <span className="text-xs font-semibold uppercase tracking-wide text-table/40">
          {players.length} {players.length === 1 ? 'player' : 'players'}
        </span>
      </div>

      {players.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-table/50">
          No players on the board yet. Ask an admin to add the roster. 🏓
        </p>
      ) : (
        <ul className="divide-y divide-black/5">
          {players.map((p) => {
            const medal = MEDALS[p.rank]
            const isChamp = p.rank === 1
            return (
              <li
                key={p.id}
                className={`flex items-center gap-3 px-5 py-3 transition hover:bg-chalk/60 ${
                  isChamp ? 'bg-amber-50/70' : ''
                }`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center">
                  {medal ? (
                    <span className="text-2xl leading-none" title={`Rank ${p.rank}`}>
                      {medal}
                    </span>
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-table/5 text-sm font-bold text-table/60">
                      {p.rank}
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-table">{p.name}</span>
                    {isChamp && (
                      <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                        Champ
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-table/45">
                    {p.wins}W · {p.losses}L · {winRate(p)} win rate
                  </div>
                </div>

                <div className="text-right leading-none">
                  <div className="font-mono text-lg font-bold tabular-nums text-table">
                    {p.elo}
                  </div>
                  <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-table/35">
                    Elo
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
