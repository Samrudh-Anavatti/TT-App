// Client-side "club entry" gate. This is a soft gate on purpose ("no real auth"):
// it stops members of one club from casually wandering into another club's board.
// It is NOT the admin PIN — recording matches / managing players is separately
// protected by the backend admin PIN (X-Admin-PIN) and is untouched by this.
//
// Real PIN values are baked in at BUILD time from VITE_CLUB_PINS (a GitHub Actions
// *variable*, just like VITE_API_URL) so they stay out of this public repo. Anyone
// who inspects the deployed bundle can still read them — that's acceptable for a
// low-stakes gate whose only job is keeping the wrong club out.
//
// VITE_CLUB_PINS format: "slug:pin" pairs separated by comma or semicolon, e.g.
//   "stanmore:1234, york-gardens:5678"
// A club with no configured PIN is left open (fail-friendly: a missing config
// never locks real members out).

function parsePins(raw) {
  const map = {}
  if (!raw) return map
  for (const pair of raw.split(/[,;]/)) {
    const idx = pair.indexOf(':')
    if (idx === -1) continue
    const slug = pair.slice(0, idx).trim()
    const pin = pair.slice(idx + 1).trim()
    if (slug && pin) map[slug] = pin
  }
  return map
}

// Dev fallback so the gate is demonstrable locally without any config.
// In a production build (VITE_CLUB_PINS set) these are ignored.
const DEV_DEFAULTS = import.meta.env.DEV
  ? { stanmore: '1234', 'york-gardens': '1234' }
  : {}

const PINS = { ...DEV_DEFAULTS, ...parsePins(import.meta.env.VITE_CLUB_PINS) }

const storageKey = (slug) => `club:${slug}`

// Whether this club is gated at all (has a configured PIN).
export function clubRequiresPin(slug) {
  return Boolean(PINS[slug])
}

// Unlocked if the club has no PIN, or the session holds the current PIN.
// Storing the PIN itself (not just a flag) means a later PIN change — shipped in a
// new build — automatically invalidates old sessions.
export function isClubUnlocked(slug) {
  if (!clubRequiresPin(slug)) return true
  return sessionStorage.getItem(storageKey(slug)) === PINS[slug]
}

export function tryUnlockClub(slug, pin) {
  const expected = PINS[slug]
  if (expected && pin === expected) {
    sessionStorage.setItem(storageKey(slug), pin)
    return true
  }
  return false
}

export function lockClub(slug) {
  sessionStorage.removeItem(storageKey(slug))
}
