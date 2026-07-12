import { Navigate, Route, Routes } from 'react-router-dom'
import ClubSelector from './pages/ClubSelector.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Challenge from './pages/Challenge.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ClubSelector />} />
      <Route path="/:slug" element={<Dashboard />} />
      <Route path="/:slug/challenge" element={<Challenge />} />
      <Route path="/:slug/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
