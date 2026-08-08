/*
 * 店舗一覧のデータ。
 *
 * backend にはまだ店舗のエンドポイントが無いため、今はダミーを返す。
 * API ができたら fetchShops の中身だけを差し替えれば画面側は変えずに済む
 * （auth.ts と同じく、失敗は例外ではなく戻り値で表現する形にする）。
 */

import shopHero from '../assets/brand/shop-hero.jpg'
import shopSample from '../assets/brand/shop-sample.jpg'
import work1 from '../assets/brand/work-1.jpg'
import work2 from '../assets/brand/work-2.jpg'
import work3 from '../assets/brand/work-3.jpg'

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
}

/**
 * 店舗一覧を取得する。
 * backend が未実装なので、今は Figma と同じ 12 件のダミーを返すだけ。
 */
export function fetchShops(): Shop[] {
  return Array.from({ length: 12 }, (_, i) => ({ ...SAMPLE, id: i + 1 }))
}

/** 料金表の 1 行。 */
export type PriceRow = {
  label: string
  /** 「¥ 10,000」のような表示用の文字列 */
  price: string
}

/** 掲載ページに出す口コミ 1 件。 */
export type Review = {
  id: number
  /** 「2023/06/12」 */
  date: string
  /** 「A.H 30代・女性」 */
  author: string
  /** 「3列車シートカバー取付」 */
  menu: string
  rating: number
  title: string
  body: string
}

/** 掲載ページ（詳細）で使う情報。一覧の Shop に詳細を足したもの。 */
export type ShopDetail = Shop & {
  phone: string
  /** 店舗紹介。COMMENT 欄に出る */
  comment: string
  /** メイン画像。カルーセルの 1 枚目 */
  heroImageUrl: string
  /** カルーセルの枚数。ドットの数に使う */
  heroCount: number
  /** 施工事例の写真 */
  works: string[]
  basePrices: PriceRow[]
  /** 料金表の下に出る注意書き */
  priceNote: string
  optionPrices: PriceRow[]
  /** 支払い方法。改行をそのまま出す */
  paymentMethods: string
  reviews: Review[]
}

const SAMPLE_REVIEW: Review = {
  id: 0,
  date: '2023/06/12',
  author: 'A.H 30代・女性',
  menu: '3列車シートカバー取付',
  rating: 4.5,
  title: '家まで出張していただいて助かりました！',
  body: '買い替えた車にシートカバーがついていなかったので、こちらにお願いしました。車屋さんに持って行って施工....',
}

/**
 * 掲載ページの情報を取得する。
 * 一覧と同じくダミー。id は受け取るが、返す中身は今は固定。
 */
export function fetchShopDetail(id: number): ShopDetail {
  return {
    ...SAMPLE,
    id,
    phone: '06-1234-5678',
    comment:
      '初めてご利用なさる方も安心してお任せください！\n遠方の方でも気軽にご利用いただけるように、C&coverでは関東、関西圏なら何処へでも出張対応を行うことができます。',
    heroImageUrl: shopHero,
    heroCount: 3,
    works: [work1, work2, work3],
    basePrices: [
      { label: '軽自動車', price: '¥ 10,000' },
      { label: '二列車', price: '¥ 13,000' },
      { label: '三列車', price: '¥ 15,000' },
      { label: '外車', price: '¥ 18,000 ~' },
      { label: 'シートカバー取り外し', price: '¥ 3,000' },
    ],
    priceNote: 'シートカバーの取り外しのみは行っておりません',
    optionPrices: [{ label: '神奈川、東京、大阪市内', price: '¥ 5,000' }],
    paymentMethods:
      'カード\n（VISA、Master、JCB）\n電子マネー\n（交通系電子マネー（Suicaなど）nanaco、iD、QUICPay）\nQRコード決済\n（PayPay、d払い、楽天ペイ）',
    reviews: [
      { ...SAMPLE_REVIEW, id: 1 },
      { ...SAMPLE_REVIEW, id: 2 },
    ],
  }
}
