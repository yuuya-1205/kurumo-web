import { Link } from 'react-router'
import type { Shop } from '../api/shops'
import heartFilledIcon from '../assets/brand/heart-filled.svg'
import heartIcon from '../assets/brand/heart.svg'
import starsIcon from '../assets/brand/stars.svg'
import { selectIsFavorite, toggled } from '../store/favoritesSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

type ShopCardProps = {
  shop: Shop
}

/*
 * 一覧に並ぶ店舗カード。Figma の「仮予約」コンポーネント。
 *
 * カードは 351x400 の固定サイズで、中の要素は Figma の座標をそのまま絶対配置で置く。
 * フローで組み直すとキャッチコピー（left 29）と情報ブロック（left 27）の 2px 差が
 * 潰れてしまうため。
 *
 * お気に入りは一覧を離れても残したいので、画面ではなく store で持つ。
 */
export function ShopCard({ shop }: ShopCardProps) {
  const dispatch = useAppDispatch()
  const favorite = useAppSelector((state) => selectIsFavorite(state, shop.id))

  return (
    <article className="relative h-[400px] w-[351px] overflow-hidden rounded-field bg-back shadow-list-menu">
      {/*
        Figma ではカード全体がリンク。ただし中にお気に入りボタンがあり、
        a の中に button を置けないので、カードを覆う透明なリンクを 1 枚敷いている。
        ボタンはこれより上（z-2）に置いて、押しても遷移しないようにする。
      */}
      <Link
        className="absolute inset-0 z-[1]"
        to={`/shops/${shop.id}`}
        aria-label={`${shop.name} の詳細を見る`}
      />

      {/* 画像 351x207。読み込み前は Figma と同じ灰色を敷く */}
      <div className="absolute left-0 top-0 h-[207px] w-full bg-gray-200">
        <img className="size-full object-cover" src={shop.imageUrl} alt="" />
      </div>

      {/*
        Figma 上のアイコン寸法は 40 x 40。
        お気に入り済みの絵は Pencil のお気に入り画面にあったものを使う（塗りつぶし）。
        枠の丸は CSS で描き、中のハートだけ差し替える。
      */}
      <button
        type="button"
        className="absolute left-[228px] top-[183px] z-[2] size-10 cursor-pointer"
        onClick={() => dispatch(toggled(shop.id))}
        aria-pressed={favorite}
        aria-label={favorite ? 'お気に入りから外す' : 'お気に入りに追加'}
      >
        {favorite ? (
          <span className="flex size-10 items-center justify-center rounded-full border-2 border-primary-300 bg-back">
            {/* Pencil 上のハートは 25 x 22.938 */}
            <img src={heartFilledIcon} alt="" width={21} height={19.3} />
          </span>
        ) : (
          <img src={heartIcon} alt="" width={40} height={40} />
        )}
      </button>

      {shop.supportsVisit && (
        <span className="absolute left-[273px] top-[191px] flex h-6 items-center rounded-[4px] bg-accent-300 px-2 font-latin text-[12px] font-bold text-text-inverse">
          出張可能
        </span>
      )}

      <p className="absolute left-[29px] top-[223px] h-[41px] w-[173px] font-latin text-[16px] font-bold leading-6 text-gray-900">
        {shop.catchphrase}
      </p>

      <h2 className="absolute left-[27px] top-[280px] font-latin text-[24px] font-bold leading-[29px] text-gray-900">
        {shop.name}
      </h2>

      {/*
       * 星は Figma から書き出した 88x16 の画像。評価値に応じて見た目は変わらないので、
       * 数値は隣に出しつつ、読み上げ用のラベルを持たせている。
       * 実データにつなぐときは星の描き分けが要る。
       */}
      <img
        className="absolute left-[27px] top-[317px]"
        src={starsIcon}
        alt={`5 段階中 ${shop.rating}`}
        width={88}
        height={16}
      />
      <span className="absolute left-[123px] top-[317px] font-latin text-[12px] font-bold leading-[15px] text-gray-900">
        {shop.rating}
      </span>
      {/*
        Figma ではリンクだが、口コミ一覧の画面がまだ無い。
        壊れた遷移を作らないよう、今は見た目だけ合わせて span で置いている。
      */}
      <span className="absolute left-[156px] top-[317px] font-latin text-[12px] font-bold leading-[15px] text-primary-300 underline [text-underline-position:from-font]">
        口コミ件数({shop.reviewCount})
      </span>

      <span className="absolute left-[27px] top-[342px] font-latin text-[12px] font-bold leading-[15px] text-primary-300">
        住所
      </span>
      <p className="absolute left-[67px] top-[341px] font-latin text-[12px] leading-[18px] text-gray-900">
        {shop.address}
      </p>

      <span className="absolute left-[27px] top-[368px] font-latin text-[12px] font-bold leading-[15px] text-primary-300">
        平均施行費用
      </span>
      <p className="absolute left-[107px] top-[367px] font-latin text-[12px] leading-[18px] text-gray-900">
        {shop.averagePrice}
      </p>
    </article>
  )
}
