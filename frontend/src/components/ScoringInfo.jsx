// Friendly, non-technical explainer of the rating system's *sentiment*:
// ratings move fast, leads don't last, everyone's always in reach.
export default function ScoringInfo() {
  return (
    <section className="card p-6">
      <h2 className="flex items-center gap-2 font-extrabold tracking-tight text-table">
        <span aria-hidden>⚡</span> How ratings work
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-table/60">
        Win and you climb, lose and you slip — and here it moves{' '}
        <span className="font-semibold text-table">fast</span>. We run a high-swing rating on
        purpose, so a good run rockets you up the board and a couple of losses can knock a
        leader right back into the pack.
      </p>
      <ul className="mt-4 space-y-2 text-sm text-table/70">
        <li className="flex gap-2">
          <span aria-hidden>🚀</span>
          <span>Beat someone above you and you take a big jump — upsets pay well.</span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden>🎢</span>
          <span>No one holds the top for long. Leads are temporary; keep playing to defend yours.</span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden>🎯</span>
          <span>You're never more than a few wins from catching the person ahead of you.</span>
        </li>
      </ul>
    </section>
  )
}
