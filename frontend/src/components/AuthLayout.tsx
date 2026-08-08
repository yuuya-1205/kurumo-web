import type { ReactNode } from 'react'
import { Logo } from './Logo'
import './AuthLayout.css'

type AuthLayoutProps = {
  children: ReactNode
  /** ロゴの下に置く一文（「入力した情報は予約時などに利用されます。」など） */
  lead?: ReactNode
  /** フォームの幅（px）。既定は Figma の 504px */
  width?: number
}

/**
 * ログイン・新規登録で共通の枠。
 * オレンジのヘッダー、中央のロゴ、その下のコンテンツという構成。
 */
export function AuthLayout({ children, lead, width }: AuthLayoutProps) {
  return (
    <div className="auth">
      <header className="auth-header">
        <Logo width={142} variant="light" />
      </header>

      <main className="auth-body" style={width ? { width } : undefined}>
        <Logo width={277} />
        {lead && <p className="auth-lead">{lead}</p>}
        {children}
      </main>
    </div>
  )
}
