import { Navigate, Route, Routes } from 'react-router'
import { HealthCheckPage } from './pages/HealthCheckPage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignUpDonePage } from './pages/auth/SignUpDonePage'
import { SignUpEmailPage } from './pages/auth/SignUpEmailPage'
import { SignUpPasswordPage } from './pages/auth/SignUpPasswordPage'
import { SignUpProfilePage } from './pages/auth/SignUpProfilePage'
import { SignUpSentPage } from './pages/auth/SignUpSentPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpEmailPage />} />
      <Route path="/signup/password" element={<SignUpPasswordPage />} />
      <Route path="/signup/sent" element={<SignUpSentPage />} />
      <Route path="/signup/profile" element={<SignUpProfilePage />} />
      <Route path="/signup/done" element={<SignUpDonePage />} />
      {/* backend の疎通確認用。画面の実装とは独立した開発者向けページ */}
      <Route path="/debug/health" element={<HealthCheckPage />} />
    </Routes>
  )
}

export default App
