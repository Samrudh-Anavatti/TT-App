import { Navigate, Route, Routes } from 'react-router-dom'
import ClubSelector from './pages/ClubSelector.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Challenge from './pages/Challenge.jsx'
import Admin from './pages/Admin.jsx'
import RequireClubPin from './components/RequireClubPin.jsx'
import DevNote from './components/DevNote.jsx'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<ClubSelector />} />
        <Route
          path="/:slug"
          element={
            <RequireClubPin>
              <Dashboard />
            </RequireClubPin>
          }
        />
        <Route
          path="/:slug/challenge"
          element={
            <RequireClubPin>
              <Challenge />
            </RequireClubPin>
          }
        />
        {/* Admin is protected by its own (stronger) backend admin PIN, not the club gate. */}
        <Route path="/:slug/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DevNote />
    </>
  )
}
