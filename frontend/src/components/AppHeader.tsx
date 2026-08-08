import menuIcon from '../assets/brand/menu.svg'
import { Logo } from './Logo'

type AppHeaderProps = {
  onMenuClick?: () => void
}

/**
 * ログイン後の画面で使うヘッダー。
 * 認証画面の AuthLayout のヘッダーと違い、左にハンバーガーメニューが入り
 * ロゴがその右に並ぶ（Figma: メニュー x=90 / ロゴ x=162）。
 */
export function AppHeader({ onMenuClick }: AppHeaderProps) {
  return (
    <header className="flex h-[var(--auth-header-height)] w-full shrink-0 items-center gap-6 rounded-b-2xl bg-accent-300 pl-[90px]">
      <button
        type="button"
        className="flex size-12 cursor-pointer items-center justify-center"
        onClick={onMenuClick}
        aria-label="メニューを開く"
      >
        {/* Figma 上のアイコン寸法は 48 x 48 */}
        <img src={menuIcon} alt="" width={48} height={48} />
      </button>
      <Logo width={142} variant="light" />
    </header>
  )
}
