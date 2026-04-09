import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      {/* More pages will be added here as we convert them */}
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}
