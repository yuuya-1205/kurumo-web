import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  fetchMe,
  login,
  signup,
  updateMe,
  type ApiResult,
  type AuthSession,
  type User,
} from '../api/auth'
import { clearToken, readToken, writeToken } from '../api/token'
import { AuthContext, type AuthContextValue, type AuthState } from './AuthContext'

/**
 * ログイン状態をアプリ全体で共有する。
 * 状態管理ライブラリは入れない方針なので、useState + Context で持つ。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  /*
   * 起動時の復元。トークンが残っていても失効している可能性があるので、
   * GET /auth/me が通って初めてログイン中として扱う。
   */
  useEffect(() => {
    const token = readToken()
    if (token === null) {
      setState({ status: 'anonymous' })
      return
    }

    let alive = true
    void (async () => {
      const result = await fetchMe(token)
      if (!alive) {
        return
      }

      if (result.ok) {
        setState({ status: 'authenticated', user: result.data })
        return
      }

      // 401 はトークンが無効なので捨てる。通信できなかっただけの場合
      // （status が null）は一時的な可能性があるのでトークンは残し、
      // この起動では未ログインとして扱う。
      if (result.status === 401) {
        clearToken()
      }
      setState({ status: 'anonymous' })
    })()

    return () => {
      alive = false
    }
  }, [])

  const startSession = useCallback((session: AuthSession) => {
    writeToken(session.token)
    setState({ status: 'authenticated', user: session.user })
  }, [])

  const signIn = useCallback(
    async (email: string, password: string): Promise<ApiResult<AuthSession>> => {
      const result = await login(email, password)
      if (result.ok) {
        startSession(result.data)
      }
      return result
    },
    [startSession],
  )

  const signUp = useCallback(
    async (email: string, password: string): Promise<ApiResult<AuthSession>> => {
      const result = await signup(email, password)
      if (result.ok) {
        startSession(result.data)
      }
      return result
    },
    [startSession],
  )

  const signOut = useCallback(() => {
    clearToken()
    setState({ status: 'anonymous' })
  }, [])

  const updateName = useCallback(
    async (name: string): Promise<ApiResult<User>> => {
      const token = readToken()
      if (token === null) {
        // トークンが無いので呼ぶ前に失敗として返す。形は API の戻り値と揃える。
        return { ok: false, status: 401, error: 'unauthorized', fields: null }
      }

      const result = await updateMe(token, name)
      if (result.ok) {
        setState({ status: 'authenticated', user: result.data })
      } else if (result.status === 401) {
        signOut()
      }
      return result
    },
    [signOut],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ state, signIn, signUp, updateName, signOut }),
    [state, signIn, signUp, updateName, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
