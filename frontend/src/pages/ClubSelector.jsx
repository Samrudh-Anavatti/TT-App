import { Link } from 'react-router-dom'
import { KNOWN_CLUBS } from '../api.js'
import { clubRequiresPin } from '../clubAccess.js'
import Shell from '../components/Shell.jsx'

const STEPS = [
  {
    title: 'Find your club',
    body: 'Pick your club from the boards above.',
  },
  {
    title: 'Enter your PIN',
    body: 'Your club shares a short PIN. Boards marked 🔒 need it to open.',
  },
  {
    title: 'Not on the board yet?',
    body: 'Ask a club admin to add you — you’ll appear in the rankings straight away.',
  },
]

export default function ClubSelector() {
  return (
    <Shell subtitle="Table tennis club rankings">
      <div className="mx-auto max-w-xl animate-slide-up">
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-ball">
            Club rankings · Elo ladder
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-table">
            Pick your club
          </h1>
          <p className="mt-2 text-table/60">
            Leaderboards, challenges and match history — one board per club.
          </p>
        </div>

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
              <div className="mt-1 flex items-center gap-1.5 text-sm text-table/50">
                <span>/{club.slug}</span>
                {clubRequiresPin(club.slug) && <span title="PIN required">· 🔒</span>}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 card p-6">
          <h2 className="flex items-center gap-2 font-extrabold tracking-tight text-table">
            <span aria-hidden>🏓</span> New here?
          </h2>
          <ol className="mt-4 space-y-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ball/10 text-sm font-bold text-ball">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold text-table">{step.title}</div>
                  <div className="text-sm text-table/55">{step.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Shell>
  )
}
