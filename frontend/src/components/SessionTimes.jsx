// "When you can play" panel: the club's practice / challenge session times.
export default function SessionTimes({ club }) {
  const sessions = club?.sessions || []
  if (sessions.length === 0) return null

  return (
    <section className="panel overflow-hidden" aria-labelledby="sessions-title">
      <div className="panel-head">
        <h2 id="sessions-title" className="panel-title">Practice sessions</h2>
      </div>

      <dl className="divide-y divide-ink/5">
        {sessions.map((s) => (
          <div key={s.days} className="flex items-baseline justify-between gap-3 px-5 py-3">
            <dt className="condensed text-lg font-extrabold">{s.days}</dt>
            <dd className="text-sm text-ink/80">{s.time}</dd>
          </div>
        ))}
      </dl>

      <p className="border-t border-ink/10 px-5 py-3 text-sm text-muted">
        Come down during these times to play and settle your challenges.
      </p>
    </section>
  )
}
