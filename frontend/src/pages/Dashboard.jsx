import { Link, useParams } from 'react-router-dom'
import { api, getClubMeta } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import Shell, { SkeletonPanel } from '../components/Shell.jsx'
import Leaderboard from '../components/Leaderboard.jsx'
import NoticeBoard from '../components/NoticeBoard.jsx'
import RecentMatches from '../components/RecentMatches.jsx'
import SessionTimes from '../components/SessionTimes.jsx'
import ScoringInfo from '../components/ScoringInfo.jsx'

export default function Dashboard() {
  const { slug } = useParams()
  const known = getClubMeta(slug)

  const club = useApi(() => api.getClub(slug), [slug])
  const leaderboard = useApi(() => api.getLeaderboard(slug), [slug])
  const matches = useApi(() => api.getRecentMatches(slug), [slug])
  const requests = useApi(() => api.getMatchRequests(slug), [slug])

  const clubName = club.data?.name || known?.name || slug

  if (club.error?.status === 404) {
    return (
      <Shell slug={slug} heading="Club not found">
        <div className="panel mx-auto max-w-md p-8 text-center">
          <p className="text-lg font-bold">There’s no club called “{slug}”</p>
          <p className="mt-1 text-sm text-muted">Check the link, or it may not be set up yet.</p>
          <Link to="/" className="btn-primary mt-5">Go to the home club</Link>
        </div>
      </Shell>
    )
  }

  return (
    <Shell
      slug={slug}
      heading="The ladder"
      intro={`Every result at ${clubName} moves the rankings. Beat someone above you to climb.`}
    >
      {(leaderboard.error || matches.error) && (
        <p role="alert" className="panel mb-5 border-ball/40 px-5 py-3 text-sm font-medium text-ball-dark">
          Can’t reach the club server right now. Refresh the page to try again.
        </p>
      )}

      {/* Two columns on desktop; on phones the wrappers dissolve (`contents`) so
          `order` interleaves the panels: ladder, challenges, results, then info. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start lg:gap-7">
        <div className="contents lg:flex lg:flex-col lg:gap-7">
          <div className="order-1">
            {leaderboard.loading ? <SkeletonPanel rows={8} /> : <Leaderboard players={leaderboard.data || []} />}
          </div>
          <div className="order-3">
            {matches.loading ? <SkeletonPanel rows={4} /> : <RecentMatches matches={matches.data || []} />}
          </div>
        </div>
        <div className="contents lg:flex lg:flex-col lg:gap-7">
          <div className="order-2">
            {requests.loading ? (
              <SkeletonPanel rows={2} />
            ) : (
              <NoticeBoard slug={slug} requests={requests.data || []} />
            )}
          </div>
          <div className="order-4">
            <SessionTimes club={known} />
          </div>
          <div className="order-5">
            <ScoringInfo />
          </div>
        </div>
      </div>
    </Shell>
  )
}
