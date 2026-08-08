import { useParams } from 'react-router'
import { fetchShopDetail, type PriceRow } from '../api/shops'
import arrowIcon from '../assets/brand/arrow.svg'
import calendarIcon from '../assets/brand/calendar.svg'
import dotsIcon from '../assets/brand/dots.svg'
import mailIcon from '../assets/brand/mail.svg'
import pinIcon from '../assets/brand/pin.svg'
import starsIcon from '../assets/brand/stars.svg'
import { AppHeader } from '../components/AppHeader'
import { ReviewCard } from '../components/ReviewCard'

/** 節のラベル。「施工事例」「基本料金表 (税抜き)」など */
const sectionLabelClass = 'font-latin text-[16px] font-bold leading-[19px] text-primary-300'

/** 白いカード。料金表・支払い方法・COMMENT で共通 */
const panelClass = 'rounded-field bg-back shadow-list-menu'

/** 掲載ページ（店舗詳細）。Figma の「掲載ページ」。 */
export function ShopDetailPage() {
  const { id } = useParams()
  const shop = fetchShopDetail(Number(id) || 1)

  return (
    <div className="flex flex-1 flex-col bg-back [color-scheme:light]">
      <AppHeader />

      {/* コンテンツ幅 1098px（Figma: x=91〜1189）。下部バーに隠れないよう余白を取る */}
      <main className="mx-auto w-[1098px] max-w-[calc(100%-40px)] pb-[161px]">
        {/* ヘッダー下端から 55px（Figma: 90 → 145） */}
        <div className="mt-[55px] flex gap-[17px]">
          {/* ドットは画像の外ではなく上に重ねる（Figma: 画像 145〜495 に対しドット 460） */}
          <div className="relative h-[350px] w-[590px] shrink-0">
            <img
              className="size-full rounded-field bg-gray-200 object-cover"
              src={shop.heroImageUrl}
              alt={shop.name}
            />
            {/* Figma 上のドットは 60.512 x 12.173。カルーセルは未実装なので表示のみ */}
            <img
              className="absolute bottom-[23px] left-1/2 -translate-x-1/2"
              src={dotsIcon}
              alt=""
              width={60.512}
              height={12.173}
            />
          </div>

          <div className="w-[491px]">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-latin text-[24px] font-bold leading-[29px] text-text-base">
                  {shop.name}
                </h1>
                <p className="mt-[8px] flex items-center gap-2">
                  <img src={starsIcon} alt={`5 段階中 ${shop.rating}`} width={88} height={16} />
                  <span className="font-latin text-[24px] font-bold leading-[29px] text-gray-900">
                    {shop.rating}
                  </span>
                  {/* 口コミ一覧の画面が無いので今は見た目だけ */}
                  <span className="font-latin text-[16px] font-bold text-accent-300 underline [text-underline-position:from-font]">
                    口コミ件数({shop.reviewCount})
                  </span>
                </p>
              </div>

              <button
                type="button"
                className="mt-[4px] flex shrink-0 cursor-pointer items-center gap-2 rounded-pill bg-primary-300 px-6 py-3 font-jp text-[24px] font-bold leading-[35px] text-primary-50"
              >
                {/* Figma 上のアイコン寸法は 24 x 26.667 */}
                <img src={calendarIcon} alt="" width={24} height={26.667} />
                予約する
              </button>
            </div>

            <p className={`mt-[8px] ${sectionLabelClass}`}>住所</p>
            <div className="mt-[8px] flex items-center justify-between">
              <p className="font-latin text-[16px] leading-6 text-gray-900">{shop.address}</p>
              <span className="flex items-center gap-1">
                {/* Figma 上のアイコン寸法は 32 x 32 */}
                <img src={pinIcon} alt="" width={32} height={32} />
                <a
                  className="font-latin text-[16px] leading-6 text-accent-300 underline [text-underline-position:from-font]"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  GoogleMapで見る
                </a>
              </span>
            </div>

            <div className="mt-[18px] flex items-end justify-between">
              <div>
                <p className={sectionLabelClass}>電話番号</p>
                <p className="mt-[8px] font-latin text-[24px] font-bold leading-6 text-gray-900">
                  {shop.phone}
                </p>
              </div>
              <a
                className="flex items-center gap-2.5 rounded-pill bg-accent-300 px-6 py-2 font-jp text-[24px] font-bold leading-[35px] text-primary-50"
                href={`tel:${shop.phone.replace(/-/g, '')}`}
              >
                {/* Figma 上のアイコン寸法は 24 x 24 */}
                <img src={mailIcon} alt="" width={24} height={24} />
                お問合せ
              </a>
            </div>

            <section className={`mt-[22px] px-3 py-4 ${panelClass}`}>
              <h2 className={sectionLabelClass}>COMMENT</h2>
              <p className="mt-2 whitespace-pre-line font-latin text-[16px] leading-6 text-gray-900">
                {shop.comment}
              </p>
            </section>
          </div>
        </div>

        {/* 施工事例。Figma: 520 （メイン画像の下端 495 から 25px） */}
        <section className="mt-[20px]">
          <h2 className={sectionLabelClass}>施工事例</h2>
          {/* 幅は Figma の 773px（91〜864）。広げると右の矢印が口コミ側へはみ出す */}
          <div className="relative mt-4 flex w-[773px] gap-[9px]">
            {shop.works.map((src, i) => (
              <img
                key={src}
                className="h-[167.566px] w-[251.271px] rounded-field bg-gray-200 object-cover"
                src={src}
                alt={`施工事例 ${i + 1}`}
              />
            ))}
            {/* Figma 上の矢印は 39.674 x 39.818。送りは未実装なので今は表示のみ */}
            <img
              className="absolute left-[3.99px] top-1/2 -translate-y-1/2 rotate-180"
              src={arrowIcon}
              alt=""
              width={39.674}
              height={39.818}
            />
            <img
              className="absolute right-[15px] top-1/2 -translate-y-1/2"
              src={arrowIcon}
              alt=""
              width={39.674}
              height={39.818}
            />
          </div>
        </section>

        <div className="mt-[16px] flex gap-4">
          {/* 左：料金表 */}
          <div className="w-[406px]">
            <h2 className={sectionLabelClass}>基本料金表 (税抜き)</h2>
            <section className={`mt-4 flex flex-col gap-3 px-6 py-4 ${panelClass}`}>
              {shop.basePrices.map((row, i) => (
                <div key={row.label} className="contents">
                  <PriceLine row={row} />
                  {/* Figma の区切り線は primary-300 の 0.5px */}
                  {i < shop.basePrices.length - 1 && (
                    <hr className="border-t-[0.5px] border-t-primary-300" />
                  )}
                </div>
              ))}
              <hr className="border-t-[0.5px] border-t-primary-300" />
              <div>
                <p className={sectionLabelClass}>その他</p>
                <p className="mt-[4px] font-latin text-[16px] leading-[18px] text-text-base">
                  {shop.priceNote}
                </p>
              </div>
            </section>

            <h2 className={`mt-[16px] ${sectionLabelClass}`}>オプション料金(税抜き)</h2>
            <section className={`mt-[14px] px-6 py-4 ${panelClass}`}>
              {shop.optionPrices.map((row) => (
                <PriceLine key={row.label} row={row} />
              ))}
            </section>
          </div>

          {/* 中：支払い方法 */}
          <div className="w-[351px]">
            <h2 className={sectionLabelClass}>お支払い方法</h2>
            <section className={`mt-[14px] px-6 py-4 ${panelClass}`}>
              <p className="whitespace-pre-line font-latin text-[16px] leading-6 text-text-base">
                {shop.paymentMethods}
              </p>
            </section>
          </div>

          {/* 右：口コミ。Figma では施工事例と同じ高さから始まる */}
          <div className="-mt-[219px] w-[309px]">
            <h2 className={sectionLabelClass}>口コミ</h2>
            <div className="mt-[16px] flex flex-col gap-4">
              {shop.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <button
              type="button"
              className="mx-auto mt-4 block cursor-pointer rounded-pill bg-primary-300 px-6 py-2 font-jp text-[16px] font-bold text-primary-50"
            >
              口コミを読む
            </button>
          </div>
        </div>
      </main>

      {/* 下部に貼り付く予約バー。Figma: 高さ 81 */}
      <div className="sticky bottom-0 flex h-[81px] w-full items-center justify-center bg-back shadow-[0_-1px_4px_0_#cfcfcf]">
        <button
          type="button"
          className="flex h-[54.667px] w-[280px] cursor-pointer items-center justify-center gap-2 rounded-pill bg-primary-300 font-jp text-[16px] font-bold text-primary-50"
        >
          <img src={calendarIcon} alt="" width={24} height={26.667} />
          予約する
        </button>
      </div>
    </div>
  )
}

/** 料金表の 1 行。左にラベル、右に金額。 */
function PriceLine({ row }: { row: PriceRow }) {
  return (
    <div className="flex items-center justify-between font-latin text-[16px] leading-[19px] text-text-base">
      <span>{row.label}</span>
      <span className="font-bold">{row.price}</span>
    </div>
  )
}
