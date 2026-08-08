import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout, authFormClass } from '../../components/AuthLayout'
import { Button } from '../../components/Button'
import { SocialAuthButtons } from '../../components/SocialAuthButtons'
import { PasswordField, TextField } from '../../components/TextField'

export function LoginPage() {
  const navigate = useNavigate()

  // API は未接続。今は画面遷移だけ行う。
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
  }

  return (
    <AuthLayout>
      <form className={authFormClass} onSubmit={handleSubmit}>
        <TextField
          label="メールアドレス"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="caruser29@gmail.com"
        />
        <PasswordField label="パスワード" name="password" autoComplete="current-password" />

        {/* 位置は Figma 基準。form の gap 19px に足りない分をマージンで補う */}
        <Link
          className="self-end mt-[5px] font-latin text-[16px] leading-[19px] text-accent-300 underline [text-underline-position:from-font]"
          to="/password-reset"
        >
          パスワードを忘れた
        </Link>

        <Button type="submit" width={284} className="mt-[13px]">
          ログイン
        </Button>
      </form>

      <SocialAuthButtons />

      {/* ソーシャルボタンの下に 16px 空けて置く */}
      <Button width={351} className="mt-4" onClick={() => navigate('/signup')}>
        新規登録をする
      </Button>
    </AuthLayout>
  )
}
