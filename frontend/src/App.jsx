import { Navigate, Route, Routes } from 'react-router-dom'
import { DEFAULT_CLUB } from './api.js'
import Dashboard from './pages/Dashboard.jsx'
import Challenge from './pages/Challenge.jsx'
import Admin from './pages/Admin.jsx'
import Tournaments from './pages/Tournaments.jsx'
import TournamentDetail from './pages/TournamentDetail.jsx'
import DevNote from './components/DevNote.jsx'

export default function App() {
  return (
    <>
      <Routes>
        {/* Single-club app: the root goes straight to the club board (no picker). */}
        <Route path="/" element={<Navigate to={`/${DEFAULT_CLUB}`} replace />} />
        <Route path="/:slug" element={<Dashboard />} />
        <Route path="/:slug/challenge" element={<Challenge />} />
        <Route path="/:slug/tournaments" element={<Tournaments />} />
        <Route path="/:slug/tournaments/:tid" element={<TournamentDetail />} />
        {/* Admin is protected by the backend admin PIN (X-Admin-PIN). */}
        <Route path="/:slug/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DevNote />
    </>
  )
}
