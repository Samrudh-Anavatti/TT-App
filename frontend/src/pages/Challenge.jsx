import { useParams } from 'react-router-dom'
import { api, getClubMeta } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import Shell from '../components/Shell.jsx'
import ChallengeForm from '../components/ChallengeForm.jsx'
import SessionTimes from '../components/SessionTimes.jsx'

export default function Challenge() {
  const { slug } = useParams()
  const known = getClubMeta(slug)
  const players = useApi(() => api.getLeaderboard(slug), [slug])

  return (
    <Shell
      slug={slug}
      heading="Challenge someone"
      intro="Post a challenge to the ladder page, then settle it at the next session."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start lg:gap-7">
        {players.loading ? (
          <div className="panel space-y-5 p-6" aria-hidden>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="skeleton h-16" />
              <div className="skeleton h-16" />
            </div>
            <div className="skeleton h-16" />
            <div className="skeleton h-16" />
            <div className="skeleton h-11" />
          </div>
        ) : players.error ? (
          <p role="alert" className="panel px-5 py-4 text-sm font-medium text-ball-dark">
            Can’t load the player list right now. Refresh the page to try again.
          </p>
        ) : (
          <ChallengeForm slug={slug} players={players.data || []} />
        )}
        <SessionTimes club={known} />
      </div>
    </Shell>
  )
}
