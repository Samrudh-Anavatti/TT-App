import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { isClubUnlocked } from '../clubAccess.js'
import ClubGate from './ClubGate.jsx'

// Route guard for club-view pages: shows the ClubGate until the club PIN is
// entered (or immediately renders children if the club has no configured PIN).
export default function RequireClubPin({ children }) {
  const { slug } = useParams()
  const [unlocked, setUnlocked] = useState(() => isClubUnlocked(slug))

  if (!unlocked) return <ClubGate slug={slug} onUnlock={() => setUnlocked(true)} />
  return children
}
