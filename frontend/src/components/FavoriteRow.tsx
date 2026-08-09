import { Link } from 'react-router'
import type { Shop } from '../api/shops'
import heartFilledIcon from '../assets/brand/heart-filled.svg'
import starsIcon from '../assets/brand/stars.svg'
import { toggled } from '../store/favoritesSlice'
import { useAppDispatch } from '../store/hooks'

type FavoriteRowProps = {
  shop: Shop
  /** 「お気に入り登録日」に出す文字列 */
  favoritedAt: string
}

/*
 * お気に入り一覧の 1 行。Pencil の「仮予約」（お気に入り画面のもの）。
 *
 * 一覧の ShopCard と情報は同じだが、縦積みのカードではなく横並びのリストで
 * 寸法も別物なので、共通化せず別コンポーネントにしている。
 *
 * 外枠 893x263（padding 16/32）。中の 829x231 に絶対配置で置く。
 */
export function FavoriteRow({ shop, favoritedAt }: FavoriteRowProps) {
  const dispatch = useAppDispatch()

  return (
    <article className="relative h-[263px] w-[893px] overflow-hidden rounded-field bg-back px-8 py-4 shadow-[0_1px_3.5px_0_#cfcfcf]">
      <div className="relative h-[231px] w-[829px]">
        {/* お気に入り登録日。ハートと同じ行に置く */}
        {/* 日付はラベルの右 136px。折り返すとハートやバッジに被るので nowrap にする */}
        <p className="absolute left-[525px] top-[15px] whitespace-nowrap font-latin text-[16px] font-bold leading-[23px] text-gray-900">
          お気に入り登録日
          <span className="absolute left-[136px] top-px font-normal leading-[18px]">
            {favoritedAt}
          </span>
        </p>

        {/* この画面に並ぶのは登録済みのものだけなので、ハートは常に塗られた状態 */}
        <button
          type="button"
          className="absolute left-[781px] top-0 flex size-12 cursor-pointer items-center justify-center rounded-full border-2 border-primary-300 bg-back"
          onClick={() => dispatch(toggled(shop.id))}
          aria-pressed
          aria-label="お気に入りから外す"
        >
          {/* Pencil 上のハートは 25 x 22.938 */}
          <img src={heartFilledIcon} alt="" width={25} height={22.938} />
        </button>

        <div className="absolute left-0 top-6 h-[207px] w-[351px] bg-gray-200">
          <img className="size-full object-cover" src={shop.imageUrl} alt="" />
        </div>

        <div className="absolute left-[367px] top-[48.5px] h-[159px] w-[462px]">
          <h2 className="font-latin text-[24px] font-bold leading-[35px] text-gray-900">
            {shop.name}
          </h2>
          {shop.supportsVisit && (
            <span className="absolute left-[313px] top-0 flex h-[33px] items-center rounded-[4px] bg-accent-300 px-4 font-latin text-[16px] font-bold text-text-inverse">
              出張可能
            </span>
          )}

          {/* 星は一覧と同じ画像を 2 倍で使う（88x16 → 176x32、比率は同じ） */}
          <img
            className="absolute left-0 top-[49px]"
            src={starsIcon}
            alt={`5 段階中 ${shop.rating}`}
            width={176}
            height={32}
          />
          <span className="absolute left-[192px] top-[56px] font-latin text-[16px] font-bold leading-[23px] text-gray-900">
            {shop.rating}
          </span>
          {/* 口コミ一覧の画面がまだ無いので今は見た目だけ */}
          <span className="absolute left-[258px] top-[56px] font-latin text-[16px] font-bold leading-[23px] text-primary-300">
            口コミ件数({shop.reviewCount})
          </span>

          <p className="absolute left-0 top-[102px] font-latin text-[16px] font-bold leading-[23px] text-primary-300">
            住所
          </p>
          <p className="absolute left-[112px] top-[97px] w-[350px] font-latin text-[16px] leading-6 text-gray-900">
            {shop.address}
          </p>

          <p className="absolute left-0 top-[136px] font-latin text-[16px] font-bold leading-[23px] text-primary-300">
            平均施行費用
          </p>
          <p className="absolute left-[112px] top-[134px] font-latin text-[16px] leading-6 text-gray-900">
            {shop.averagePrice}
          </p>
        </div>

        {/* カード全体のリンク。ハートより下に敷く */}
        <Link
          className="absolute inset-0 -z-[1]"
          to={`/shops/${shop.id}`}
          aria-label={`${shop.name} の詳細を見る`}
        />
      </div>
    </article>
  )
}
