import { useState } from 'react'

// Deliberately low-key: a quiet footer link that most club members will never
// notice. Clicking it reveals a small "developer note" with the maker and the
// tech stack behind PongPoints.
const STACK = [
  { label: 'Frontend', value: 'React, Vite, Tailwind' },
  { label: 'Backend', value: 'FastAPI, SQLAlchemy' },
  { label: 'Ratings', value: 'Custom Elo engine' },
  { label: 'Hosting', value: 'Azure, GitHub Pages' },
  { label: 'CI/CD', value: 'GitHub Actions' },
]

export default function DevNote() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      {open && (
        <div className="absolute bottom-full right-0 z-20 mb-2 w-72 max-w-[calc(100vw-2rem)] animate-slide-up rounded-lg border border-ink/10 bg-paper p-4 shadow-lift">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-ball-dark">Developer note</div>
              <div className="mt-0.5 font-bold text-ink">PongPoints</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="-mr-1 -mt-1 grid h-8 w-8 place-items-center rounded text-muted transition hover:bg-ink/5 hover:text-ink"
              aria-label="Close developer note"
            >
              ✕
            </button>
          </div>

          <p className="mt-2 text-sm text-muted">
            Built by <span className="font-semibold text-ink">Samrudh Anavatti</span>: a small
            Elo-ranked ladder for table tennis clubs.
          </p>

          <dl className="mt-3 space-y-1.5">
            {STACK.map((s) => (
              <div key={s.label} className="flex gap-2 text-xs">
                <dt className="w-16 shrink-0 font-semibold text-muted">{s.label}</dt>
                <dd className="text-ink/80">{s.value}</dd>
              </div>
            ))}
          </dl>

          <a
            href="https://github.com/samrudh-anavatti/TT-App"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ball-dark underline-offset-2 hover:underline"
          >
            View source ↗
          </a>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-quiet font-medium"
        aria-expanded={open}
      >
        Developer note
      </button>
    </div>
  )
}
