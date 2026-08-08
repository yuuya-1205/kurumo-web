import type { ComponentProps } from 'react'

type ButtonProps = ComponentProps<'button'> & {
  /** Figma 上のボタン幅（px）。画面ごとに異なるので呼び出し側で指定する */
  width?: number
}

const base =
  'h-[var(--auth-control-height)] max-w-full px-6 rounded-pill ' +
  'bg-primary-300 text-primary-50 font-jp text-[16px] font-bold leading-normal text-center ' +
  'cursor-pointer hover:brightness-[1.06] disabled:opacity-50 disabled:cursor-default'

/** 角丸ピル型のプライマリボタン。Figma の「対応ボタン」コンポーネント。 */
export function Button({ width, style, className, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={className ? `${base} ${className}` : base}
      style={{ width, ...style }}
      {...props}
    />
  )
}
