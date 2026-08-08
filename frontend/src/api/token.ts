/*
 * ログイン状態を表す JWT の置き場所。読み書き・削除をこのファイルに閉じる。
 *
 * トークンは localStorage に保存している。トレードオフを明記しておく。
 * localStorage は JavaScript から読めるため、XSS を許すと
 * スクリプトにトークンをそのまま読み出され、持ち出されうる。
 * HttpOnly Cookie ならスクリプトから読めないのでこのリスクは無いが、
 * CSRF 対策と backend 側の Cookie 発行が別途必要になる。
 * オーナーの判断で今は JWT + localStorage を採っている。
 *
 * 将来 HttpOnly Cookie へ移す場合に備えて、保存の詳細を知っているのは
 * このファイルだけにしてある（画面から localStorage を直接触らない）。
 */

const STORAGE_KEY = 'kurumo.auth.token'

/** 保存されているトークンを返す。無ければ null。 */
export function readToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    // プライベートモードなどで localStorage を触れない場合。未ログイン扱いにする。
    return null
  }
}

/** トークンを保存する。 */
export function writeToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, token)
  } catch {
    // 保存できなくてもその場のログインは続けられるので、握りつぶしてよい。
    // 次のリロードで未ログインに戻る。
  }
}

/** トークンを捨てる（ログアウト時と、期限切れが分かったとき）。 */
export function clearToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 読めない環境なら消す対象も無い。
  }
}
