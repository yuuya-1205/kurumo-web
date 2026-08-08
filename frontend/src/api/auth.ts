/*
 * 認証まわりの API 呼び出し。
 *
 * health.ts の probe と同じ方針で、失敗しても例外を投げず戻り値で表現する
 * （失敗メッセージを画面に出したいため）。呼び出し側は result.ok で分岐する。
 */

// API のベース URL。未設定なら dev サーバーの proxy 経由（/api → localhost:8080）。
// health.ts にも同じ定数がある。共通化するとあちらを触ることになるので、
// 今は同じ規則で持つだけにしてある。
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

/** backend が返すユーザー。 */
export type User = {
  id: number
  name: string
  email: string
  created_at: string
  updated_at: string
}

/**
 * 検証エラー（400）のフィールド単位のメッセージ。
 * キーは入力欄の名前（email / password / name）。
 */
export type FieldErrors = Record<string, string>

/**
 * backend 共通のエラーフォーマット。
 * health.ts の ErrorBody に、検証エラーのときだけ付く fields を足したもの。
 */
type AuthErrorBody = {
  error: string
  fields?: FieldErrors
}

/**
 * API 呼び出し 1 回分の結果。例外は投げない。
 * 失敗時の status は、サーバーに届かなかった場合だけ null になる（probe と同じ）。
 */
export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number | null; error: string; fields: FieldErrors | null }

/** signup / login の成功レスポンス。 */
export type AuthSession = {
  token: string
  user: User
}

/** POST /auth/signup — アカウントを作る。メール重複は 409。 */
export async function signup(email: string, password: string): Promise<ApiResult<AuthSession>> {
  const result = await request('POST', '/auth/signup', { email, password })
  return mapOk(result, toAuthSession)
}

/** POST /auth/login — ログインする。メール・パスワード違いは 401。 */
export async function login(email: string, password: string): Promise<ApiResult<AuthSession>> {
  const result = await request('POST', '/auth/login', { email, password })
  return mapOk(result, toAuthSession)
}

/** GET /auth/me — トークンからログイン中のユーザーを取る。期限切れなどは 401。 */
export async function fetchMe(token: string): Promise<ApiResult<User>> {
  const result = await request('GET', '/auth/me', undefined, token)
  return mapOk(result, toUser)
}

/** PATCH /auth/me — 名前を更新する。 */
export async function updateMe(token: string, name: string): Promise<ApiResult<User>> {
  const result = await request('PATCH', '/auth/me', { name }, token)
  return mapOk(result, toUser)
}

/** 401 かどうか。トークンを捨てるかの判断に使う。 */
export function isUnauthorized(result: ApiResult<unknown>): boolean {
  return !result.ok && result.status === 401
}

/**
 * fetch の薄いラッパー。レスポンス本文は形が分からないので unknown で返し、
 * 各関数側の型ガードで絞る。
 */
async function request(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown,
  token?: string,
): Promise<ApiResult<unknown>> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    const parsed = await parseBody(res)

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: messageOf(parsed, res.status),
        fields: fieldsOf(parsed),
      }
    }

    return { ok: true, status: res.status, data: parsed }
  } catch {
    // サーバー未起動や接続断はここに来る。レスポンスが無いので status は null。
    // 例外のメッセージは英語で利用者には読めないため、画面向けの文言に置き換える。
    return {
      ok: false,
      status: null,
      error: 'サーバーに接続できませんでした。時間をおいて試してください。',
      fields: null,
    }
  }
}

/** 成功時の本文を期待した型に絞る。形が違えば失敗として返す。 */
function mapOk<T>(result: ApiResult<unknown>, pick: (body: unknown) => T | null): ApiResult<T> {
  if (!result.ok) {
    return result
  }

  const data = pick(result.data)
  if (data === null) {
    return {
      ok: false,
      status: result.status,
      error: 'サーバーの応答を解釈できませんでした',
      fields: null,
    }
  }

  return { ok: true, status: result.status, data }
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    // JSON でないレスポンス（502 の HTML など）は生テキストのまま返す。
    return text
  }
}

/**
 * エラーレスポンスから表示用メッセージを取り出す。
 * backend のメッセージは英語なので、画面に出す直前に FormError が日本語へ置き換える。
 */
function messageOf(body: unknown, status: number): string {
  if (isErrorBody(body)) {
    return body.error
  }
  // 契約に無い応答（proxy が返す 502 など）。原因が追えるようステータスも残す。
  return `通信に失敗しました。時間をおいて試してください。（HTTP ${status}）`
}

/** 検証エラーのフィールド別メッセージ。無ければ null。 */
function fieldsOf(body: unknown): FieldErrors | null {
  if (!isErrorBody(body) || typeof body.fields !== 'object' || body.fields === null) {
    return null
  }

  const fields: FieldErrors = {}
  for (const [key, value] of Object.entries(body.fields)) {
    if (typeof value === 'string') {
      fields[key] = value
    }
  }
  return fields
}

function isErrorBody(body: unknown): body is AuthErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as AuthErrorBody).error === 'string'
  )
}

/** {"token": ..., "user": ...} を AuthSession にする。形が違えば null。 */
function toAuthSession(body: unknown): AuthSession | null {
  if (typeof body !== 'object' || body === null) {
    return null
  }

  const token = (body as { token?: unknown }).token
  const user = toUser(body)
  if (typeof token !== 'string' || user === null) {
    return null
  }

  return { token, user }
}

/** {"user": ...} から User を取り出す。形が違えば null。 */
function toUser(body: unknown): User | null {
  if (typeof body !== 'object' || body === null) {
    return null
  }

  const user = (body as { user?: unknown }).user
  return isUser(user) ? user : null
}

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const user = value as Partial<User>
  return (
    typeof user.id === 'number' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    typeof user.created_at === 'string' &&
    typeof user.updated_at === 'string'
  )
}
