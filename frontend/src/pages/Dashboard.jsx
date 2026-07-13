import { Link, useParams } from 'react-router-dom'
import { api, KNOWN_CLUBS } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import Shell from '../components/Shell.jsx'
import Leaderboard from '../components/Leaderboard.jsx'
import NoticeBoard from '../components/NoticeBoard.jsx'
import RecentMatches from '../components/RecentMatches.jsx'

export default function Dashboard() {
  const { slug } = useParams()
  const known = KNOWN_CLUBS.find((c) => c.slug === slug)

  const club = useApi(() => api.getClub(slug), [slug])
  const leaderboard = useApi(() => api.getLeaderboard(slug), [slug])
  const matches = useApi(() => api.getRecentMatches(slug), [slug])
  const requests = useApi(() => api.getMatchRequests(slug), [slug])

  const clubName = club.data?.name || known?.name || slug

  const adminLink = (
    <Link to={`/${slug}/admin`} className="btn-ghost !bg-white/10 !text-white hover:!bg-white/20">
      Admin
    </Link>
  )

  if (club.error?.status === 404) {
    return (
      <Shell title={clubName} right={adminLink}>
        <div className="card mx-auto max-w-md p-8 text-center">
          <p className="text-lg font-bold text-table">Club not found</p>
          <p className="mt-1 text-sm text-table/60">
            No club with slug “{slug}”. It may not be seeded yet.
          </p>
          <Link to="/" className="btn-primary mt-4">Back to clubs</Link>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title={clubName} subtitle="Leaderboard & challenges" right={adminLink}>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Link
          to={`/${slug}/challenge`}
          className="card group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <span className="text-2xl" aria-hidden>🏓</span>
          <div className="min-w-0">
            <div className="font-semibold text-table">Request a match</div>
            <div className="text-xs text-table/50">Call someone out</div>
          </div>
          <span className="ml-auto text-ball transition group-hover:translate-x-1">→</span>
        </Link>
        <div className="card flex items-center gap-3 p-4">
          <span className="text-2xl" aria-hidden>📈</span>
          <div className="min-w-0">
            <div className="font-semibold text-table">Climb the ranks</div>
            <div className="text-xs text-table/50">Win to raise your Elo</div>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="text-2xl" aria-hidden>🏅</span>
          <div className="min-w-0">
            <div className="font-semibold text-table">Top 3 get medals</div>
            <div className="text-xs text-table/50">Gold, silver, bronze</div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {leaderboard.loading ? (
          <SkeletonCard />
        ) : (
          <Leaderboard players={leaderboard.data || []} />
        )}
        {requests.loading ? (
          <SkeletonCard />
        ) : (
          <NoticeBoard slug={slug} requests={requests.data || []} />
        )}
      </div>

      <div className="mt-5">
        {matches.loading ? <SkeletonCard /> : <RecentMatches matches={matches.data || []} />}
      </div>

      {(leaderboard.error || matches.error) && (
        <p className="mt-4 text-center text-sm text-ball">
          Couldn’t reach the API. Is the backend running?
        </p>
      )}
    </Shell>
  )
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse p-5">
      <div className="h-5 w-32 rounded bg-table/10" />
      <div className="mt-4 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded bg-table/5" />
        ))}
      </div>
    </div>
  )
}
