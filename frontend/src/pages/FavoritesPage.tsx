import { useState } from 'react'
import { fetchShops } from '../api/shops'
import { AppHeader } from '../components/AppHeader'
import { FavoriteRow } from '../components/FavoriteRow'
import { Pagination } from '../components/Pagination'
import { selectFavoriteIds } from '../store/favoritesSlice'
import { useAppSelector } from '../store/hooks'

/** Pencil の 1 画面に並ぶ行数 */
const PER_PAGE = 6

/** お気に入り一覧。Pencil の「お気に入り」画面。 */
export function FavoritesPage() {
  const [shops] = useState(() => fetchShops())
  const favoriteIds = useAppSelector(selectFavoriteIds)
  const [page, setPage] = useState(1)

  // store が持つのは ID だけなので、店舗の中身はここで引き当てる。
  const favorites = favoriteIds
    .map((id) => shops.find((shop) => shop.id === id))
    .filter((shop) => shop !== undefined)

  const totalPages = Math.max(1, Math.ceil(favorites.length / PER_PAGE))
  // 解除して件数が減ったときに、無くなったページへ留まらないようにする
  const currentPage = Math.min(page, totalPages)
  const visible = favorites.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  return (
    <div className="flex flex-1 flex-col bg-back [color-scheme:light]">
      <AppHeader />

      {/* コンテンツ幅 893px（Pencil: x=194〜1087） */}
      <main className="mx-auto w-[893px] max-w-[calc(100%-40px)] pb-30">
        {/* ヘッダー下端から 56px（Pencil: 90 → 146） */}
        <h1 className="mt-14 text-center font-latin text-[24px] font-bold leading-[35px] text-gray-900">
          お気に入り
        </h1>

        {favorites.length === 0 ? (
          <p className="mt-[50px] text-center font-latin text-[16px] leading-6 text-gray-900">
            お気に入りに登録した店舗はまだありません。
          </p>
        ) : (
          <>
            {/* 見出し下端から 1 行目まで 50px（Pencil: 35 → 85）。行間は 24px */}
            <div className="mt-[50px] flex flex-col gap-6">
              {visible.map((shop) => (
                <FavoriteRow
                  key={shop.id}
                  shop={shop}
                  /* 登録日はまだ持っていない。API ができたら実際の日付を出す */
                  favoritedAt="2024年7月1日"
                />
              ))}
            </div>

            <div className="mt-[62px] flex justify-center">
              <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
