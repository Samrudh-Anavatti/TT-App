import { useState } from 'react'

const COLLAPSED_COUNT = 10

function record(p) {
  if (!p.matches_played) return 'No matches yet'
  const pct = Math.round((p.wins / p.matches_played) * 100)
  return `${p.wins} won, ${p.losses} lost (${pct}%)`
}

export default function Leaderboard({ players = [] }) {
  const [expanded, setExpanded] = useState(false)
  const canCollapse = players.length > COLLAPSED_COUNT
  const visible = expanded || !canCollapse ? players : players.slice(0, COLLAPSED_COUNT)

  return (
    <section className="panel overflow-hidden" aria-labelledby="ladder-title">
      <div className="panel-head">
        <h2 id="ladder-title" className="panel-title">Rankings</h2>
        <span className="text-sm text-muted">
          {players.length} {players.length === 1 ? 'player' : 'players'}
        </span>
      </div>

      {players.length === 0 ? (
        <div className="px-5 py-8">
          <p className="font-semibold">No one’s on the ladder yet</p>
          <p className="mt-1 text-sm text-muted">An admin adds players from the Admin tab.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[2.75rem_1fr_auto] gap-3 border-b border-ink/5 px-5 py-2 text-xs font-medium text-muted">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">Elo</span>
          </div>
          <ol>
            {visible.map((p) => {
              const leader = p.rank === 1 && !p.unrated
              return (
                <li
                  key={p.id}
                  className={`relative grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 border-b border-ink/5 px-5 py-3 last:border-b-0 ${
                    leader ? 'bg-ball/[0.07]' : ''
                  }`}
                >
                  {leader && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-ball" />}
                  <span
                    className={`num text-[1.6rem] leading-none ${
                      leader ? 'text-ball-dark' : p.unrated ? 'text-muted/50' : 'text-ink/45'
                    }`}
                  >
                    {p.unrated ? '–' : p.rank}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate font-semibold">{p.name}</span>
                      {leader && <span className="hidden shrink-0 text-xs font-semibold text-ball-dark sm:inline">Leader</span>}
                    </div>
                    <div className="text-[0.82rem] text-muted">
                      {p.unrated ? 'Awaiting a rating from a coach' : record(p)}
                    </div>
                  </div>

                  <span
                    className={`num text-right text-[1.6rem] leading-none ${p.unrated ? 'text-muted/50' : ''}`}
                    title={p.unrated ? 'Unrated' : undefined}
                  >
                    {p.unrated ? '–' : p.elo}
                    {p.unrated && <span className="sr-only">Unrated</span>}
                  </span>
                </li>
              )
            })}
          </ol>
          {canCollapse && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="w-full border-t border-ink/10 px-5 py-3 text-sm font-semibold text-ball-dark transition hover:bg-ink/[0.03]"
            >
              {expanded ? 'Show top 10 only' : `Show all ${players.length} players`}
            </button>
          )}
        </>
      )}
    </section>
  )
}
