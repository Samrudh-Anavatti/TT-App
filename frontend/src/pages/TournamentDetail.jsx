import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import Shell, { SkeletonPanel } from '../components/Shell.jsx'

export default function TournamentDetail() {
  const { slug, tid } = useParams()
  const pin = sessionStorage.getItem(`pin:${slug}`) || null

  const detail = useApi(() => api.getTournament(slug, tid), [slug, tid])
  // Club roster (admin only) for the "add participant" picker.
  const players = useApi(
    () => (pin ? api.listPlayers(slug, pin) : Promise.resolve([])),
    [slug, tid, pin]
  )

  const t = detail.data
  const isAdmin = Boolean(pin)
  const isActive = t?.status === 'active'

  const refresh = () => {
    detail.reload()
    players.reload()
  }

  const intro = t
    ? t.status === 'completed' && t.winner_name
      ? `${t.winner_name} won and banked +${t.rating_prize} rating.`
      : `${t.participant_count} player${t.participant_count === 1 ? '' : 's'}. The winner takes +${t.rating_prize} rating.`
    : undefined

  return (
    <Shell slug={slug} heading={t?.name || (detail.loading ? 'Tournament' : 'Tournament not found')} intro={intro}>
      <div className="space-y-5">
        <Link
          to={`/${slug}/tournaments`}
          className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-muted transition hover:text-ink"
        >
          <span aria-hidden>←</span> All tournaments
        </Link>

        {detail.loading ? (
          <SkeletonPanel rows={4} />
        ) : detail.error ? (
          <div className="panel px-5 py-10 text-center">
            <p className="font-semibold">This tournament doesn’t exist or was removed</p>
            <Link to={`/${slug}/tournaments`} className="btn-ghost mt-4">See all tournaments</Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className={`inline-flex items-center gap-1.5 font-semibold ${isActive ? 'text-table' : 'text-muted'}`}>
                <span aria-hidden className={`h-2 w-2 rounded-full ${isActive ? 'bg-ball' : 'bg-muted/50'}`} />
                {isActive ? 'In progress' : 'Finished'}
              </span>
              <span className="text-muted">
                Winner’s prize <span className="num text-lg text-ink">+{t.rating_prize}</span>
              </span>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start lg:gap-7">
              <div className="space-y-5 lg:space-y-7">
                <Standings standings={t.standings} winnerId={t.winner_id} />

                {isAdmin && isActive && (
                  <AdminControls
                    slug={slug}
                    pin={pin}
                    tid={tid}
                    tournament={t}
                    roster={players.data || []}
                    onChange={refresh}
                  />
                )}
              </div>

              <MatchLog matches={t.matches} />
            </div>
          </>
        )}
      </div>
    </Shell>
  )
}

function Standings({ standings, winnerId }) {
  return (
    <section className="panel overflow-hidden" aria-labelledby="standings-title">
      <div className="panel-head">
        <h2 id="standings-title" className="panel-title">Standings</h2>
      </div>
      {standings.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">No players entered yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[0.95rem]">
            <thead>
              <tr className="border-b border-ink/5 text-left text-xs text-muted">
                <th scope="col" className="w-16 py-2 pl-5 pr-2 font-medium">Pos</th>
                <th scope="col" className="py-2 pr-2 font-medium">Player</th>
                <th scope="col" className="py-2 pr-2 text-right font-medium">Won</th>
                <th scope="col" className="py-2 pr-2 text-right font-medium">Lost</th>
                <th scope="col" className="py-2 pl-2 pr-5 text-right font-medium">Elo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {standings.map((r, i) => {
                const won = r.player_id === winnerId
                return (
                  <tr key={r.player_id} className={won ? 'bg-ball/[0.07]' : ''}>
                    <td className={`num py-2.5 pl-5 pr-2 text-xl ${won ? 'text-ball-dark' : 'text-ink/45'}`}>{i + 1}</td>
                    <td className="py-2.5 pr-2 font-semibold">
                      {r.name}
                      {won && <span className="ml-2 text-xs font-semibold text-ball-dark">Winner</span>}
                    </td>
                    <td className="num py-2.5 pr-2 text-right text-lg">{r.wins}</td>
                    <td className="num py-2.5 pr-2 text-right text-lg text-ink/60">{r.losses}</td>
                    <td className="num py-2.5 pl-2 pr-5 text-right text-lg">{r.elo}</td>
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

function MatchLog({ matches }) {
  return (
    <section className="panel overflow-hidden" aria-labelledby="log-title">
      <div className="panel-head">
        <h2 id="log-title" className="panel-title">Results</h2>
        {matches.length > 0 && <span className="text-sm text-muted">Winner’s gain</span>}
      </div>
      {matches.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">No results recorded yet.</p>
      ) : (
        <ul className="divide-y divide-ink/5">
          {matches.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[0.95rem]">
              <span>
                <span className="font-semibold">{m.winner_name}</span>
                <span className="text-muted"> beat </span>
                <span>{m.loser_name}</span>
              </span>
              <span className="num text-xl">+{m.elo_change}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function AdminControls({ slug, pin, tid, tournament, roster, onChange }) {
  const participantIds = new Set(tournament.standings.map((s) => s.player_id))
  const canAdd = roster.filter((p) => p.active && !participantIds.has(p.id))
  const participants = tournament.standings

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      onChange?.()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel overflow-hidden border-table/30" aria-labelledby="manage-title">
      <div className="panel-head bg-table/[0.04]">
        <h2 id="manage-title" className="panel-title">Run this tournament</h2>
        <span className="text-sm text-muted">Admin</span>
      </div>

      <div className="space-y-5 p-5">
        {error && <p role="alert" className="field-error">{error.message}</p>}

        <AddParticipant candidates={canAdd} busy={busy}
          onAdd={(playerId) => run(() => api.addTournamentParticipant(slug, pin, tid, { player_id: playerId }))} />

        <RecordResult participants={participants} busy={busy}
          onRecord={(winnerId, loserId) =>
            run(() => api.recordTournamentMatch(slug, pin, tid, { winner_id: winnerId, loser_id: loserId }))} />
      </div>

      <div className="border-t border-ink/10 px-5 py-4">
        <button
          className="btn-primary"
          disabled={busy || participants.length === 0}
          onClick={() => {
            if (confirm('Complete the tournament and award the winner their rating prize? This can’t be undone.')) {
              run(() => api.completeTournament(slug, pin, tid))
            }
          }}
        >
          Finish and award prize
        </button>
        <p className="mt-2 text-sm text-muted">
          Ends the tournament. The top of the standings wins +{tournament.rating_prize} rating.
        </p>
      </div>
    </section>
  )
}

function AddParticipant({ candidates, onAdd, busy }) {
  const [sel, setSel] = useState('')
  return (
    <div>
      <label className="label" htmlFor="add-player">Add a player</label>
      <div className="flex gap-2">
        <select id="add-player" className="input" value={sel} onChange={(e) => setSel(e.target.value)} disabled={busy}>
          <option value="">
            {candidates.length ? 'Choose a player' : 'Everyone active is already in'}
          </option>
          {candidates.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.elo})</option>
          ))}
        </select>
        <button
          className="btn-ghost shrink-0"
          disabled={busy || !sel}
          onClick={() => { onAdd(sel); setSel('') }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

function RecordResult({ participants, onRecord, busy }) {
  const [winner, setWinner] = useState('')
  const [loser, setLoser] = useState('')
  const same = winner && winner === loser
  const ready = winner && loser && !same

  const options = (exclude) => participants.filter((p) => p.player_id !== exclude)

  return (
    <fieldset className="rounded-md border border-ink/10 p-4">
      <legend className="px-1 text-sm font-medium text-ink/80">Record a result</legend>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <select className="input" aria-label="Winner" value={winner} onChange={(e) => setWinner(e.target.value)} disabled={busy}>
          <option value="">Winner</option>
          {options(loser).map((p) => (
            <option key={p.player_id} value={p.player_id}>{p.name}</option>
          ))}
        </select>
        <span className="text-center text-sm text-muted">beat</span>
        <select className="input" aria-label="Loser" value={loser} onChange={(e) => setLoser(e.target.value)} disabled={busy}>
          <option value="">Loser</option>
          {options(winner).map((p) => (
            <option key={p.player_id} value={p.player_id}>{p.name}</option>
          ))}
        </select>
      </div>
      {same && <p className="field-error mt-2">Winner and loser must be different players.</p>}
      <button
        className="btn-primary mt-3"
        disabled={busy || !ready}
        onClick={() => { onRecord(winner, loser); setWinner(''); setLoser('') }}
      >
        {busy ? 'Saving…' : 'Record result'}
      </button>
    </fieldset>
  )
}
