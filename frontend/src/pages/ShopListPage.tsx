import { useState } from 'react'
import { fetchShops, SORT_OPTIONS, type Shop, type SortOption } from '../api/shops'
import checkboxIcon from '../assets/brand/checkbox.svg'
import chevronIcon from '../assets/brand/chevron.svg'
import { AppHeader } from '../components/AppHeader'
import { ShopCard } from '../components/ShopCard'

/** 店舗一覧。Figma の「一覧」画面。 */
export function ShopListPage() {
  // API がまだ無いので取得は同期。つなぐときに useEffect + loading 状態にする。
  const [shops] = useState<Shop[]>(() => fetchShops())
  const [sort, setSort] = useState<SortOption>('現在地順')
  const [visitOnly, setVisitOnly] = useState(false)

  const visible = visitOnly ? shops.filter((shop) => shop.supportsVisit) : shops

  return (
    <div className="flex flex-1 flex-col bg-back [color-scheme:light]">
      <AppHeader />

      {/* コンテンツ幅 1101px（Figma: x=90〜1191）を中央に置く */}
      <main className="mx-auto w-[1101px] max-w-[calc(100%-40px)] pb-30">
        {/* ヘッダー下端からフィルタまで 89px（Figma: 90 → 179） */}
        <div className="mt-[89px] flex items-center justify-end gap-2">
          <SortSelect value={sort} onChange={setSort} />
          <VisitOnlyCheckbox checked={visitOnly} onChange={setVisitOnly} />
        </div>

        {/* フィルタ下端からグリッドまで 40px（Figma: 210 → 250）。列 24px / 行 40px */}
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-10">
          {visible.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>

        {visible.length === 0 && (
          <p className="mt-10 font-latin text-[16px] text-gray-900">
            条件に合う店舗が見つかりませんでした。
          </p>
        )}
      </main>
    </div>
  )
}

/** 並び順のドロップダウン。見た目は Figma の角丸ピル。 */
function SortSelect({
  value,
  onChange,
}: {
  value: SortOption
  onChange: (value: SortOption) => void
}) {
  return (
    <div className="relative h-[31px] w-[119px]">
      <select
        className="size-full cursor-pointer appearance-none rounded-3xl border border-primary-300 bg-primary-50 pl-4 pr-6 font-latin text-[12px] font-bold text-gray-900"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        aria-label="並び順"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {/* Figma 上の矢印は 9 x 5.249（下向きなので 90 度回した状態で置かれている） */}
      <img
        className="pointer-events-none absolute right-[15px] top-1/2 -translate-y-1/2 rotate-90"
        src={chevronIcon}
        alt=""
        width={5.249}
        height={9}
      />
    </div>
  )
}

/** 「遠方出張可能」の絞り込み。 */
function VisitOnlyCheckbox({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <span className="relative flex size-6 items-center justify-center">
        <input
          type="checkbox"
          className="peer absolute size-full cursor-pointer opacity-0"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        {/*
          Figma 上のアイコン寸法は 24 x 24。ただし Figma にあるのは未チェックの枠だけで、
          チェック時の見た目が無い。暫定で枠の中を primary で塗っている。
          デザインが用意されたら差し替える。
        */}
        <img src={checkboxIcon} alt="" width={24} height={24} />
        <span className="pointer-events-none absolute inset-[5px] hidden rounded-[2px] bg-primary-300 peer-checked:block" />
      </span>
      <span className="font-latin text-[12px] font-bold text-text-base">遠方出張可能</span>
    </label>
  )
}
