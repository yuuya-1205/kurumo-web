import { Navigate, Route, Routes } from 'react-router'
import { RequireAuth } from './components/RequireAuth'
import { HealthCheckPage } from './pages/HealthCheckPage'
import { HomePage } from './pages/HomePage'
import { ShopDetailPage } from './pages/ShopDetailPage'
import { ShopListPage } from './pages/ShopListPage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignUpDonePage } from './pages/auth/SignUpDonePage'
import { SignUpEmailPage } from './pages/auth/SignUpEmailPage'
import { SignUpPasswordPage } from './pages/auth/SignUpPasswordPage'
import { SignUpProfilePage } from './pages/auth/SignUpProfilePage'
import { SignUpSentPage } from './pages/auth/SignUpSentPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpEmailPage />} />
      <Route path="/signup/password" element={<SignUpPasswordPage />} />
      {/* メール送信の仕組みが無いため今は経由しない。仕組みが入ったら戻す */}
      <Route path="/signup/sent" element={<SignUpSentPage />} />
      {/* PATCH /auth/me を叩くのでトークンが要る */}
      <Route
        path="/signup/profile"
        element={
          <RequireAuth>
            <SignUpProfilePage />
          </RequireAuth>
        }
      />
      <Route path="/signup/done" element={<SignUpDonePage />} />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      {/* 店舗一覧と掲載ページ。データはまだダミーなので認証は掛けていない */}
      <Route path="/shops" element={<ShopListPage />} />
      <Route path="/shops/:id" element={<ShopDetailPage />} />
      {/* backend の疎通確認用。画面の実装とは独立した開発者向けページ */}
      <Route path="/debug/health" element={<HealthCheckPage />} />
    </Routes>
  )
}
