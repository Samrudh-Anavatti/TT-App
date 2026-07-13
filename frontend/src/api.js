// Thin API client. In dev, VITE_API_URL is unset and calls hit /api/v1
// (proxied to FastAPI). In prod it's the deployed backend base URL.
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

async function request(path, { method = 'GET', body, pin } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (pin) headers['X-Admin-PIN'] = pin

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let detail = res.statusText
    try {
      detail = (await res.json()).detail || detail
    } catch {
      /* non-JSON error */
    }
    const err = new Error(detail)
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // public
  getClub: (slug) => request(`/clubs/${slug}`),
  getLeaderboard: (slug) => request(`/clubs/${slug}/leaderboard`),
  getRecentMatches: (slug) => request(`/clubs/${slug}/matches/recent`),
  getMatchRequests: (slug) => request(`/clubs/${slug}/match-requests`),
  createMatchRequest: (slug, body) =>
    request(`/clubs/${slug}/match-requests`, { method: 'POST', body }),
  cancelMatchRequest: (slug, id) =>
    request(`/clubs/${slug}/match-requests/${id}/cancel`, { method: 'PUT' }),

  // admin
  verifyPin: (slug, pin) =>
    request(`/clubs/${slug}/admin/verify`, { method: 'POST', pin }),
  listPlayers: (slug, pin) => request(`/clubs/${slug}/admin/players`, { pin }),
  recordMatch: (slug, pin, body) =>
    request(`/clubs/${slug}/admin/matches`, { method: 'POST', pin, body }),
  addPlayer: (slug, pin, body) =>
    request(`/clubs/${slug}/admin/players`, { method: 'POST', pin, body }),
  updatePlayer: (slug, pin, id, body) =>
    request(`/clubs/${slug}/admin/players/${id}`, { method: 'PUT', pin, body }),
  deactivatePlayer: (slug, pin, id) =>
    request(`/clubs/${slug}/admin/players/${id}`, { method: 'DELETE', pin }),
  updateMatchRequest: (slug, pin, id, body) =>
    request(`/clubs/${slug}/admin/match-requests/${id}`, { method: 'PUT', pin, body }),
}

// Club metadata is baked in for now; later this can come from a /clubs list endpoint.
// `logo` points at a file in frontend/public/clubs/ (falls back to `initials` if
// missing). `sessions` are the club's practice/challenge times.
export const KNOWN_CLUBS = [
  {
    slug: 'stanmore',
    name: 'Stanmore TTC',
    initials: 'S',
    logo: `${import.meta.env.BASE_URL}clubs/stanmore.png`,
    sessions: [
      { days: 'Tue & Thu', time: 'from 8:00pm' },
      { days: 'Sun', time: '10:00am – 1:00pm' },
    ],
  },
  {
    slug: 'york-gardens',
    name: 'York Gardens TTC',
    initials: 'YG',
    logo: null,
    sessions: [{ days: 'Mon, Wed & Fri', time: 'from 6:30pm' }],
  },
]

export function getClubMeta(slug) {
  return KNOWN_CLUBS.find((c) => c.slug === slug) || null
}
