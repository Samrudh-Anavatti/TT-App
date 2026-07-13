import { useState } from 'react'

// Deliberately low-key: a faint pill tucked bottom-left that most club members
// will never notice. Clicking it reveals a small "developer note" bubble with
// the maker + the tech stack behind PongPoints.
const STACK = [
  { label: 'Frontend', value: 'React · Vite · Tailwind' },
  { label: 'Backend', value: 'FastAPI · SQLAlchemy' },
  { label: 'Ratings', value: 'Custom Elo engine' },
  { label: 'Hosting', value: 'Azure · GitHub Pages' },
  { label: 'CI/CD', value: 'GitHub Actions' },
]

export default function DevNote() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-3 left-3 z-50">
      {open && (
        <div className="mb-2 w-72 animate-slide-up rounded-2xl border border-black/5 bg-white p-4 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ball">
                Developer note
              </div>
              <div className="mt-0.5 font-extrabold text-table">PongPoints 🏓</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="-mr-1 -mt-1 rounded-lg p-1 text-table/40 transition hover:bg-table/5 hover:text-table"
              aria-label="Close developer note"
            >
              ✕
            </button>
          </div>

          <p className="mt-2 text-sm text-table/60">
            Built by <span className="font-semibold text-table">Samrudh Anavatti</span> — a
            little Elo-ranked ladder for table tennis clubs.
          </p>

          <dl className="mt-3 space-y-1.5">
            {STACK.map((s) => (
              <div key={s.label} className="flex gap-2 text-xs">
                <dt className="w-16 shrink-0 font-semibold uppercase tracking-wide text-table/40">
                  {s.label}
                </dt>
                <dd className="text-table/70">{s.value}</dd>
              </div>
            ))}
          </dl>

          <a
            href="https://github.com/samrudh-anavatti/TT-App"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-ball hover:underline"
          >
            View source ↗
          </a>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-black/5 bg-white/70 px-3 py-1.5 text-xs font-medium text-table/40 shadow-sm backdrop-blur transition hover:text-table/80 hover:shadow-card"
        aria-label="Developer note"
        aria-expanded={open}
      >
        <span className="font-mono">&lt;/&gt;</span>
        <span>dev</span>
      </button>
    </div>
  )
}
