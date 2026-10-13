// Friendly, non-technical explainer of the rating system's *sentiment*:
// ratings move fast, leads don't last, everyone's always in reach.
const POINTS = [
  'Beat someone above you and you take a big jump. Upsets pay well.',
  'No one holds the top for long. Keep playing to defend your spot.',
  'You’re never more than a few wins from catching the person ahead.',
]

export default function ScoringInfo() {
  return (
    <section className="panel p-5" aria-labelledby="scoring-title">
      <h2 id="scoring-title" className="panel-title">How ratings work</h2>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/80">
        Win and you climb, lose and you slip, and here it moves fast. We run a high-swing rating on
        purpose, so a good run lifts you up the board and a couple of losses can drop a leader back
        into the pack.
      </p>
      <ul className="mt-4 space-y-2.5 text-[0.95rem] text-ink/80">
        {POINTS.map((p) => (
          <li key={p} className="flex gap-3">
            <span aria-hidden className="mt-[0.45em] h-2 w-2 shrink-0 rounded-full bg-ball" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
