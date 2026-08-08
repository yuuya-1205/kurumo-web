import markColor from '../assets/brand/logo-mark.svg'
import markLight from '../assets/brand/logo-mark-light.svg'
import textColor from '../assets/brand/logo-text.svg'
import textLight from '../assets/brand/logo-text-light.svg'

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
 * 内側の位置と大きさは Figma のレイヤー比率をそのまま使う。
 */
export function Logo({ width, variant = 'color' }: LogoProps) {
  const mark = variant === 'light' ? markLight : markColor
  const text = variant === 'light' ? textLight : textColor

  return (
    <span
      className="relative block shrink-0 aspect-[142/45]"
      style={{ width }}
      role="img"
      aria-label="くるも"
    >
      {/* Figma: 幅 27.96% / 高さ 99.71% */}
      <img className="absolute left-0 top-0 w-[27.96%] h-[99.71%]" src={mark} alt="" />
      {/* Figma: 左 34.51% 上 36.13% 幅 65.41% 高さ 63.25% */}
      <img
        className="absolute left-[34.51%] top-[36.13%] w-[65.41%] h-[63.25%]"
        src={text}
        alt=""
      />
    </span>
  )
}
