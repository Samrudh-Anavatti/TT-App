import { Link, useParams } from 'react-router-dom'
import { api, KNOWN_CLUBS } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import Shell from '../components/Shell.jsx'
import ChallengeForm from '../components/ChallengeForm.jsx'

export default function Challenge() {
  const { slug } = useParams()
  const known = KNOWN_CLUBS.find((c) => c.slug === slug)
  const players = useApi(() => api.getLeaderboard(slug), [slug])

  return (
    <Shell
      title={known?.name || slug}
      subtitle="New challenge"
      right={
        <Link to={`/${slug}`} className="btn-ghost !bg-white/10 !text-white hover:!bg-white/20">
          ← Back
        </Link>
      }
    >
      <div className="mx-auto max-w-xl">
        <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-table">
          Challenge someone
        </h1>
        {players.loading ? (
          <div className="card h-64 animate-pulse" />
        ) : (
          <ChallengeForm slug={slug} players={players.data || []} />
        )}
      </div>
    </Shell>
  )
}
