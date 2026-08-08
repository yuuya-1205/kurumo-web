/*
 * お気に入りの保存先。
 *
 * 本来は backend に持たせるものだが、まだエンドポイントが無いので
 * ブラウザの localStorage に置いている。API ができたらこのファイルの中身を
 * 差し替えれば、store 側は変えずに済む。
 *
 * 永続化は adapter 層の関心なので、store（ui 層）から localStorage を
 * 直接触らずここを経由する。
 */

const STORAGE_KEY = 'kurumo.favorites'

/** 保存済みのお気に入り店舗 ID を読み出す。壊れていれば空で返す。 */
export function loadFavoriteIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((value): value is number => typeof value === 'number')
  } catch {
    // JSON が壊れている / localStorage が使えない（プライベートモードなど）。
    // お気に入りは失われても操作は続けられるので、空として扱う。
    return []
  }
}

/** お気に入り店舗 ID を保存する。失敗しても画面は止めない。 */
export function saveFavoriteIds(ids: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // 容量超過や書き込み不可。次回の読み出しで古い状態に戻るだけなので握る。
  }
}
