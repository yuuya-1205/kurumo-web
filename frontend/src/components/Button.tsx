import type { ComponentProps } from 'react'
import './Button.css'

type ButtonProps = ComponentProps<'button'> & {
  /** Figma 上のボタン幅（px）。画面ごとに異なるので呼び出し側で指定する */
  width?: number
}

/** 角丸ピル型のプライマリボタン。Figma の「対応ボタン」コンポーネント。 */
export function Button({ width, style, className, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={className ? `button ${className}` : 'button'}
      style={{ width, ...style }}
      {...props}
    />
  )
}
