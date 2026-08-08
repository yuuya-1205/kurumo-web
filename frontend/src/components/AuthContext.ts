import { createContext, useContext } from 'react'
import type { ApiResult, AuthSession, User } from '../api/auth'

/*
 * ログイン状態の型と Context 本体。
 * Provider（AuthProvider.tsx）と分けてあるのは、コンポーネントと
 * それ以外を同じファイルから export しないため（react/only-export-components）。
 */

/**
 * ログイン状態。
 * 起動直後は loading（保存済みトークンを GET /auth/me で確認している最中）。
 * 画面側はこの 3 状態を見て、確認中に未ログインの表示を出さないようにする。
 */
export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'anonymous' }

export type AuthContextValue = {
  state: AuthState
  /** ログインする。成功すればトークンを保存して状態を更新する */
  signIn: (email: string, password: string) => Promise<ApiResult<AuthSession>>
  /** アカウントを作る。成功すればそのままログイン状態になる */
  signUp: (email: string, password: string) => Promise<ApiResult<AuthSession>>
  /** ログイン中のユーザーの名前を更新する */
  updateName: (name: string) => Promise<ApiResult<User>>
  /** ログアウトする。トークンを捨てる */
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** ログイン状態を読む。AuthProvider の内側でだけ使える。 */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (value === null) {
    // 実装ミスなのでここは例外でよい（API の失敗とは別の話）。
    throw new Error('useAuth は AuthProvider の内側で使うこと')
  }
  return value
}
