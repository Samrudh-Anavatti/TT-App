import { Link, NavLink } from 'react-router-dom'
import { getClubMeta } from '../api.js'
import ClubBadge from './ClubBadge.jsx'
import DevNote from './DevNote.jsx'

// Shared page frame. The masthead is the table top seen from above (painted edge
// lines, centre line, net) with the page heading on it; the nav tabs sit on the
// table's near end and the current one joins the page below.
export default function Shell({ slug, heading, intro, actions, children }) {
  const club = getClubMeta(slug)
  const clubName = club?.name || slug

  const tabs = [
    { to: `/${slug}`, label: 'Ladder', end: true },
    { to: `/${slug}/challenge`, label: 'Challenge' },
    { to: `/${slug}/tournaments`, label: 'Tournaments' },
    { to: `/${slug}/admin`, label: 'Admin' },
  ]

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a
        href="#main"
        className="sr-only z-10 rounded-md bg-paper px-3 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <header className="table-top">
        <span aria-hidden className="table-net right-[calc((100vw-72rem)/2-2.5rem)] hidden xl:block" />
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex min-h-[4.5rem] items-center justify-between gap-3 pt-5">
            <Link to={`/${slug}`} className="rounded-sm transition hover:opacity-90" aria-label={`${clubName} ladder`}>
              <ClubBadge club={club || { name: clubName }} />
            </Link>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>

          <div aria-hidden className="table-centre-line relative left-1/2 mt-2 w-[calc(100vw-24px)] -translate-x-1/2 sm:mt-3" />

          <div className="pb-5 pt-5 sm:pb-7 sm:pt-7">
            <h1 className="condensed max-w-[22ch] text-[2.6rem] font-black leading-[0.92] tracking-[-0.01em] sm:text-[4rem]">
              {heading}
            </h1>
            {intro && <p className="mt-3 max-w-[56ch] text-[0.95rem] text-chalk/75 sm:text-base">{intro}</p>}
          </div>

          <nav aria-label="Club pages" className="-mx-1 flex gap-0.5 overflow-x-auto sm:gap-1">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className="table-tab shrink-0">
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-6 sm:px-8 sm:pt-8">
        {children}
      </main>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-muted sm:px-8">
          <span>{clubName} ladder, ranked by Elo</span>
          <DevNote />
        </div>
      </footer>
    </div>
  )
}

// Layout-shaped placeholder rows for loading panels.
export function SkeletonPanel({ rows = 4, title = true }) {
  return (
    <div className="panel" aria-hidden>
      {title && (
        <div className="panel-head">
          <div className="skeleton h-5 w-32" />
        </div>
      )}
      <div className="divide-y divide-ink/5">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <div className="skeleton h-6 w-6" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4" style={{ width: `${55 - (i % 3) * 12}%` }} />
              <div className="skeleton h-3 w-24" />
            </div>
            <div className="skeleton h-6 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
