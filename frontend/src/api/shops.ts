/*
 * 店舗一覧のデータ。
 *
 * backend にはまだ店舗のエンドポイントが無いため、今はダミーを返す。
 * API ができたら fetchShops の中身だけを差し替えれば画面側は変えずに済む
 * （auth.ts と同じく、失敗は例外ではなく戻り値で表現する形にする）。
 */

import shopSample from '../assets/brand/shop-sample.jpg'

/** 一覧に並ぶ店舗 1 件。 */
export type Shop = {
  id: number
  /** 店名 */
  name: string
  /** 画像の下に出る 2 行のキャッチコピー */
  catchphrase: string
  /** 評価（0〜5） */
  rating: number
  /** 口コミ件数 */
  reviewCount: number
  address: string
  /** 「4500円〜」のような表示用の文字列 */
  averagePrice: string
  imageUrl: string
  /** 出張に対応しているか。true のとき画像の上にバッジを出す */
  supportsVisit: boolean
  /** お気に入り登録済みか */
  favorite: boolean
}

/** 並び順の選択肢。今は表示のみで、切り替えても結果は変わらない。 */
export const SORT_OPTIONS = ['現在地順', '評価順', '料金順'] as const
export type SortOption = (typeof SORT_OPTIONS)[number]

const SAMPLE: Shop = {
  id: 0,
  name: 'C&cover シーアンドカバー',
  catchphrase: '施行実績地域No.1!関東出張も可能です。',
  rating: 4.5,
  reviewCount: 120,
  address: '大阪府堺市XXXXXXXXXX1-2-3あのビル2F',
  averagePrice: '4500円〜',
  imageUrl: shopSample,
  supportsVisit: true,
  favorite: false,
}

/**
 * 店舗一覧を取得する。
 * backend が未実装なので、今は Figma と同じ 12 件のダミーを返すだけ。
 */
export function fetchShops(): Shop[] {
  return Array.from({ length: 12 }, (_, i) => ({ ...SAMPLE, id: i + 1 }))
}
