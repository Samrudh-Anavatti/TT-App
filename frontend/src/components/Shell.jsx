import { Link } from 'react-router-dom'

// Shared page frame: branded header bar + centered content column.
export default function Shell({ title, subtitle, right, children }) {
  return (
    <div className="min-h-screen">
      <header className="bg-table text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ball text-white font-black shadow-sm transition group-hover:scale-105">
              🏓
            </span>
            <div className="leading-tight">
              <div className="font-extrabold tracking-tight">{title || 'PongPoints'}</div>
              {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
            </div>
          </Link>
          {right}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
