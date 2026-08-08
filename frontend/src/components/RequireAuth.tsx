import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from './AuthContext'

/**
 * ログインが要る画面を包むルートガード。未ログインならログイン画面へ送る。
 *
 * 確認中（loading）は何も描かない。ここで子やログイン画面を描いてしまうと、
 * トークンの確認が終わるまでの一瞬だけ別の画面が見えてちらつくため。
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth()

  if (state.status === 'loading') {
    return null
  }

  if (state.status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
