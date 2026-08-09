import chevronLeft from '../assets/brand/chevron-left.svg'
import chevronRight from '../assets/brand/chevron-right.svg'

type PaginationProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

/*
 * ページ送り。Pencil の「Group 1247」。
 * 丸ボタン 64x64（primary[50] の地に primary[300] の枠）と「1/2」の表示。
 */
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const button =
    'flex size-16 cursor-pointer items-center justify-center rounded-full border border-primary-300 bg-primary-50 disabled:opacity-40 disabled:cursor-default'

  return (
    <div className="flex items-center gap-6">
      <button
        type="button"
        className={button}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="前のページ"
      >
        {/* Pencil 上の矢印は 12 x 20 */}
        <img src={chevronLeft} alt="" width={12} height={20} />
      </button>

      <p className="font-latin text-[24px] font-bold leading-[29px] text-gray-900" aria-live="polite">
        {page}/{totalPages}
      </p>

      <button
        type="button"
        className={button}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="次のページ"
      >
        <img src={chevronRight} alt="" width={12} height={20} />
      </button>
    </div>
  )
}
