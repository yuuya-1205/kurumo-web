import markColor from '../assets/brand/logo-mark.svg'
import markLight from '../assets/brand/logo-mark-light.svg'
import textColor from '../assets/brand/logo-text.svg'
import textLight from '../assets/brand/logo-text-light.svg'
import './Logo.css'

type LogoProps = {
  /** ロゴ全体の幅（px）。高さは Figma の比率（142:45）から決まる */
  width: number
  /**
   * color: 白背景用（マーク #3DC0E9 / 文字 #4E4E4E）
   * light: ヘッダーなど色地用（全体 #ECF7FB）
   */
  variant?: 'color' | 'light'
}

/**
 * 「くるも」のロゴ。
 * Figma ではマークと文字が別レイヤーなので、書き出した SVG 2 枚を重ねて再現する。
 */
export function Logo({ width, variant = 'color' }: LogoProps) {
  const mark = variant === 'light' ? markLight : markColor
  const text = variant === 'light' ? textLight : textColor

  return (
    <span className="logo" style={{ width }} role="img" aria-label="くるも">
      <img className="logo-mark" src={mark} alt="" />
      <img className="logo-text" src={text} alt="" />
    </span>
  )
}
