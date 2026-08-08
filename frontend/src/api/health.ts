// API のベース URL。未設定なら dev サーバーの proxy 経由（/api → localhost:8080）。
// 本番などで直接叩く場合は .env に VITE_API_BASE_URL を定義する。
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

/** GET /healthz のレスポンス */
export type HealthResponse = {
  status: string
  time: string
}

/** GET /healthz/db のレスポンス */
export type DbHealthResponse = {
  status: string
  database: string
  in_use: number
  idle: number
}

/** backend 共通のエラーフォーマット */
export type ErrorBody = {
  error: string
}

export type Endpoint = {
  id: string
  method: 'GET'
  path: string
  label: string
  description: string
}

/** 疎通確認の対象。backend にエンドポイントを追加したらここに足す。 */
export const ENDPOINTS: Endpoint[] = [
  {
    id: 'health',
    method: 'GET',
    path: '/healthz',
    label: 'サーバー疎通',
    description: 'サーバーの生存確認。常に 200 が返る',
  },
  {
    id: 'db',
    method: 'GET',
    path: '/healthz/db',
    label: 'DB 疎通',
    description: 'DB への疎通確認。接続できない場合は 503',
  },
  {
    id: 'users',
    method: 'GET',
    path: '/users',
    label: 'ユーザー一覧',
    description: '登録済みユーザーを返す',
  },
]

/**
 * 疎通確認 1 回分の結果。
 * 失敗も画面に出したいので、例外を投げずに戻り値で表現する。
 */
export type ProbeResult = {
  ok: boolean
  /** HTTP ステータス。サーバーに届かなかった場合は null */
  status: number | null
  durationMs: number
  /** パースできた場合は JSON、できなければ生テキスト */
  body: unknown
  /** 失敗時の表示用メッセージ */
  error: string | null
}

/** エンドポイントを 1 回叩いて結果を返す。 */
export async function probe(endpoint: Endpoint): Promise<ProbeResult> {
  const start = performance.now()

  try {
    const res = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: { Accept: 'application/json' },
    })

    const text = await res.text()
    let body: unknown = text
    try {
      body = JSON.parse(text)
    } catch {
      // JSON でないレスポンスは生テキストのまま表示する
    }

    return {
      ok: res.ok,
      status: res.status,
      durationMs: elapsed(start),
      body,
      error: res.ok ? null : messageOf(body, res.status),
    }
  } catch (e) {
    // サーバー未起動や接続断はここに来る。レスポンスが無いので status は null。
    return {
      ok: false,
      status: null,
      durationMs: elapsed(start),
      body: null,
      error: e instanceof Error ? e.message : 'リクエストに失敗しました',
    }
  }
}

function elapsed(start: number): number {
  return Math.round(performance.now() - start)
}

/** エラーレスポンスから表示用メッセージを取り出す。 */
function messageOf(body: unknown, status: number): string {
  if (isErrorBody(body)) {
    return body.error
  }
  return `HTTP ${status}`
}

function isErrorBody(body: unknown): body is ErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as ErrorBody).error === 'string'
  )
}
