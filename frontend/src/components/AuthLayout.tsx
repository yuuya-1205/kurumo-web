import type { ReactNode } from 'react'
import { Logo } from './Logo'

type AuthLayoutProps = {
  children: ReactNode
  /** ロゴの下に置く一文（「入力した情報は予約時などに利用されます。」など） */
  lead?: ReactNode
  /** フォームの幅（px）。既定は Figma の 504px */
  width?: number
}

/** 認証画面のフォーム。要素間は Figma の 19px 間隔。 */
export const authFormClass = 'flex w-full flex-col items-center gap-[19px]'

/** 完了画面の本文。 */
export const authMessageClass =
  'w-full font-latin text-[16px] leading-6 tracking-[0.4px] text-gray-900'

/**
 * ログイン・新規登録で共通の枠。
 * オレンジのヘッダー、中央のロゴ、その下のコンテンツという構成。
 */
export function AuthLayout({ children, lead, width }: AuthLayoutProps) {
  return (
    // デザインがライト固定なので、OS のダークモードには追従させない
    <div className="flex flex-1 flex-col items-center bg-back [color-scheme:light]">
      <header className="box-border flex h-[var(--auth-header-height)] w-full items-center rounded-b-2xl bg-accent-300 px-8">
        <Logo width={142} variant="light" />
      </header>

      <main
        className="box-border flex w-[var(--auth-form-width)] max-w-[calc(100%-40px)] flex-col items-center pt-20 pb-30"
        style={width ? { width } : undefined}
      >
        <Logo width={277} />

        {/* ロゴ下 32px（Figma: 258 → 290）。リード文がある場合はその下に 30px */}
        {lead && (
          <p className="mt-8 font-latin text-[16px] leading-6 tracking-[0.4px] text-text-base text-center">
            {lead}
          </p>
        )}
        <div className={`flex w-full flex-col items-center ${lead ? 'mt-[30px]' : 'mt-8'}`}>
          {children}
        </div>
      </main>
    </div>
  )
}
