import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, getClubMeta } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import Shell from '../components/Shell.jsx'
import ClubBadge from '../components/ClubBadge.jsx'

export default function TournamentDetail() {
  const { slug, tid } = useParams()
  const known = getClubMeta(slug)
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

  return (
    <Shell
      title={known?.name || slug}
      subtitle="Tournament"
      badge={known && <ClubBadge club={known} />}
      right={
        <Link to={`/${slug}/tournaments`} className="btn-ghost !bg-white/10 !text-white hover:!bg-white/20">
          ← Tournaments
        </Link>
      }
    >
      <div className="mx-auto max-w-2xl space-y-5">
        {detail.loading ? (
          <div className="card h-40 animate-pulse" />
        ) : detail.error ? (
          <div className="card p-8 text-center">
            <p className="font-bold text-table">Tournament not found</p>
            <Link to={`/${slug}/tournaments`} className="btn-primary mt-4">Back to tournaments</Link>
          </div>
        ) : (
          <>
            <header className="card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-table">{t.name}</h1>
                  <p className="mt-1 text-sm text-table/55">
                    Winner takes <span className="font-semibold text-table">+{t.rating_prize}</span> rating ·{' '}
                    {t.participant_count} player{t.participant_count === 1 ? '' : 's'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-table/10 text-table/60'
                  }`}
                >
                  {isActive ? 'Active' : 'Completed'}
                </span>
              </div>
              {t.status === 'completed' && t.winner_name && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                  🥇 <span className="font-bold text-table">{t.winner_name}</span> won and banked{' '}
                  <span className="font-bold text-amber-700">+{t.rating_prize}</span> rating.
                </div>
              )}
            </header>

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

            <MatchLog matches={t.matches} />
          </>
        )}
      </div>
    </Shell>
  )
}

function Standings({ standings, winnerId }) {
  return (
    <section className="card p-6">
      <h2 className="mb-3 font-extrabold tracking-tight text-table">Standings</h2>
      {standings.length === 0 ? (
        <p className="text-sm text-table/50">No players yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-table/40">
              <th className="py-1.5 pr-2">#</th>
              <th className="py-1.5 pr-2">Player</th>
              <th className="py-1.5 pr-2 text-center">W</th>
              <th className="py-1.5 pr-2 text-center">L</th>
              <th className="py-1.5 text-right">Elo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {standings.map((r, i) => (
              <tr key={r.player_id} className={r.player_id === winnerId ? 'bg-amber-50' : ''}>
                <td className="py-2 pr-2 font-mono text-table/50">{i + 1}</td>
                <td className="py-2 pr-2 font-semibold text-table">
                  {r.player_id === winnerId && <span className="mr-1">🥇</span>}
                  {r.name}
                </td>
                <td className="py-2 pr-2 text-center text-emerald-600">{r.wins}</td>
                <td className="py-2 pr-2 text-center text-ball">{r.losses}</td>
                <td className="py-2 text-right font-mono text-table/70">{r.elo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function MatchLog({ matches }) {
  return (
    <section className="card p-6">
      <h2 className="mb-3 font-extrabold tracking-tight text-table">Match log</h2>
      {matches.length === 0 ? (
        <p className="text-sm text-table/50">No results recorded yet.</p>
      ) : (
        <ul className="divide-y divide-black/5">
          {matches.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="text-table">
                <span className="font-semibold">{m.winner_name}</span>
                <span className="text-table/40"> beat </span>
                <span className="font-semibold">{m.loser_name}</span>
              </span>
              <span className="font-mono text-xs font-bold text-emerald-600">+{m.elo_change}</span>
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
    <section className="card border-2 border-dashed border-ball/30 p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-full bg-ball/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ball">
          Admin
        </span>
        <span className="text-sm text-table/50">Manage this tournament</span>
      </div>

      {error && <p className="mb-3 text-sm text-ball">{error.message}</p>}

      <AddParticipant candidates={canAdd} busy={busy}
        onAdd={(playerId) => run(() => api.addTournamentParticipant(slug, pin, tid, { player_id: playerId }))} />

      <RecordResult participants={participants} busy={busy}
        onRecord={(winnerId, loserId) =>
          run(() => api.recordTournamentMatch(slug, pin, tid, { winner_id: winnerId, loser_id: loserId }))} />

      <div className="mt-5 border-t border-black/5 pt-4">
        <button
          className="btn-primary"
          disabled={busy || participants.length === 0}
          onClick={() => {
            if (confirm('Complete the tournament and award the winner their rating prize? This can’t be undone.')) {
              run(() => api.completeTournament(slug, pin, tid))
            }
          }}
        >
          Complete & award prize
        </button>
        <p className="mt-1.5 text-xs text-table/45">
          Ends the tournament. The top of the standings wins +{tournament.rating_prize} rating.
        </p>
      </div>
    </section>
  )
}

function AddParticipant({ candidates, onAdd, busy }) {
  const [sel, setSel] = useState('')
  return (
    <div className="mb-4">
      <label className="label">Add player</label>
      <div className="flex gap-2">
        <select className="input" value={sel} onChange={(e) => setSel(e.target.value)} disabled={busy}>
          <option value="">
            {candidates.length ? 'Select a player…' : 'Everyone active is already in'}
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
    <div className="rounded-xl bg-table/[0.03] p-4">
      <label className="label">Record a result</label>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <select className="input" value={winner} onChange={(e) => setWinner(e.target.value)} disabled={busy}>
          <option value="">Winner…</option>
          {options(loser).map((p) => (
            <option key={p.player_id} value={p.player_id}>{p.name}</option>
          ))}
        </select>
        <span className="text-center text-[10px] font-black uppercase text-table/40">beat</span>
        <select className="input" value={loser} onChange={(e) => setLoser(e.target.value)} disabled={busy}>
          <option value="">Loser…</option>
          {options(winner).map((p) => (
            <option key={p.player_id} value={p.player_id}>{p.name}</option>
          ))}
        </select>
      </div>
      {same && <p className="mt-2 text-sm text-ball">Winner and loser must differ.</p>}
      <button
        className="btn-primary mt-3"
        disabled={busy || !ready}
        onClick={() => { onRecord(winner, loser); setWinner(''); setLoser('') }}
      >
        {busy ? 'Saving…' : 'Record result'}
      </button>
    </div>
  )
}
