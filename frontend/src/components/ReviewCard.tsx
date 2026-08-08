import type { Review } from '../api/shops'
import starsIcon from '../assets/brand/stars.svg'

type ReviewCardProps = {
  review: Review
}

/**
 * 掲載ページの右カラムに並ぶ口コミ 1 件。Figma の「Frame 1197」。
 * 幅 309 / 内側の余白は左右 12・上下 16。
 */
export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="w-[309px] rounded-field bg-back px-3 py-4 shadow-list-menu">
      <p className="flex gap-2 font-latin text-[16px] leading-[19px] text-gray-900">
        <span>{review.date}</span>
        <span>{review.author}</span>
      </p>
      <p className="mt-2 font-latin text-[16px] leading-[19px] text-gray-900">{review.menu}</p>

      <p className="mt-2 flex items-center gap-2">
        {/* 星は一覧と同じ 88x16 の画像。評価値では見た目が変わらない */}
        <img src={starsIcon} alt={`5 段階中 ${review.rating}`} width={88} height={16} />
        <span className="font-latin text-[16px] font-bold leading-[19px] text-gray-900">
          {review.rating}
        </span>
      </p>

      <h3 className="mt-4 font-latin text-[16px] font-bold leading-6 text-gray-900">
        {review.title}
      </h3>
      <p className="mt-2 line-clamp-3 font-latin text-[16px] leading-6 text-gray-900">
        {review.body}
      </p>

      {/*
        Figma ではリンクだが、口コミの詳細画面がまだ無い。
        壊れた遷移を作らないよう、今は見た目だけ合わせている。
      */}
      <p className="mt-2 text-right font-latin text-[16px] leading-[18px] text-accent-300 underline [text-underline-position:from-font]">
        &gt;続きを読む
      </p>
    </article>
  )
}
