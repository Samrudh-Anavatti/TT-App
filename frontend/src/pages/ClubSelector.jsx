import { Link } from 'react-router-dom'
import { KNOWN_CLUBS } from '../api.js'
import Shell from '../components/Shell.jsx'

export default function ClubSelector() {
  return (
    <Shell subtitle="Table tennis club rankings">
      <div className="mx-auto max-w-xl text-center animate-slide-up">
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-table">
          Pick your club
        </h1>
        <p className="mt-2 text-table/60">
          Leaderboards, challenges and match history — one board per club.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {KNOWN_CLUBS.map((club) => (
            <Link
              key={club.slug}
              to={`/${club.slug}`}
              className="card group p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-table">{club.name}</span>
                <span className="text-ball transition group-hover:translate-x-1">→</span>
              </div>
              <div className="mt-1 text-sm text-table/50">/{club.slug}</div>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  )
}
