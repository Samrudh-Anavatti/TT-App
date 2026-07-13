import { useState } from 'react'

// Round club badge: shows the club's logo when available, else its initials on the
// ball-orange disc. Falls back gracefully if the logo file is missing or fails.
export default function ClubBadge({ club, className = 'h-9 w-9 text-sm' }) {
  const [failed, setFailed] = useState(false)
  const showLogo = club?.logo && !failed

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-ball font-black text-white shadow-sm ${className}`}
    >
      {showLogo ? (
        <img
          src={club.logo}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{club?.initials || '🏓'}</span>
      )}
    </span>
  )
}
