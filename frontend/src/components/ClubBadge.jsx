import { useState } from 'react'

// Club mark for the masthead: the club's logo at its natural shape when it has
// one (logos are drawn for a dark background), else its initials on a ball-coloured
// tile with the name beside it. Falls back if the logo file is missing or fails.
export default function ClubBadge({ club }) {
  const [failed, setFailed] = useState(false)

  if (club?.logo && !failed) {
    return (
      <img
        src={club.logo}
        alt={club.name}
        className="h-9 w-auto sm:h-11"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 min-w-[2.25rem] place-items-center rounded-md bg-ball px-1.5 text-sm font-black text-on-ball">
        {club?.initials || 'TT'}
      </span>
      {club?.name && <span className="font-bold tracking-tight">{club.name}</span>}
    </span>
  )
}
