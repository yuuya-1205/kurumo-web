/*
 * ログイン後の着地点。
 *
 * これは意図的に最小限のプレースホルダ。このアプリの中心機能がまだ決まっていないため、
 * 「認証が通ってユーザー情報を取れている」ことを確認するためだけの画面として置いている。
 * Figma のデザインも無いので、枠は認証画面と同じ AuthLayout を借りている。
 * 中心機能が決まったらこの画面ごと作り直す前提で、ここを作り込まないこと。
 */
import { useNavigate } from 'react-router'
import { AuthLayout, authMessageClass } from '../components/AuthLayout'
import { useAuth } from '../components/AuthContext'
import { Button } from '../components/Button'

export function HomePage() {
  const navigate = useNavigate()
  const { state, signOut } = useAuth()

  // RequireAuth を通った後なので、ここに来る時点でログイン済み。
  if (state.status !== 'authenticated') {
    return null
  }

  const handleSignOut = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout>
      <p className={authMessageClass}>
        {/* 登録直後に名前を入れていない場合もあるので、空でも壊れないようにする */}
        {state.user.name === '' ? '（名前は未設定）' : state.user.name} さん、ログイン中です。
      </p>
      <p className={`${authMessageClass} mt-2`}>{state.user.email}</p>

      <Button width={284} className="mt-6" onClick={handleSignOut}>
        ログアウト
      </Button>
    </AuthLayout>
  )
}
