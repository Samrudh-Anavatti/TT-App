// "When you can play" card — the club's practice / challenge session times.
export default function SessionTimes({ club }) {
  const sessions = club?.sessions || []
  if (sessions.length === 0) return null

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-black/5 px-5 py-4">
        <h2 className="flex items-center gap-2 font-extrabold tracking-tight text-table">
          <span aria-hidden>🕒</span> Practice sessions
        </h2>
      </div>

      <ul className="divide-y divide-black/5">
        {sessions.map((s) => (
          <li key={s.days} className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="font-semibold text-table">{s.days}</span>
            <span className="text-sm font-medium text-table/60">{s.time}</span>
          </li>
        ))}
      </ul>

      <p className="border-t border-black/5 bg-chalk/50 px-5 py-3 text-xs text-table/55">
        Come down during these times to play and settle your challenges. 🏓
      </p>
    </section>
  )
}
