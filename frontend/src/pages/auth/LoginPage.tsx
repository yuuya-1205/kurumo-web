import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout'
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
      <form className="auth-form" onSubmit={handleSubmit}>
        <TextField
          label="メールアドレス"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="caruser29@gmail.com"
        />
        <PasswordField label="パスワード" name="password" autoComplete="current-password" />

        <Link className="auth-link" to="/password-reset">
          パスワードを忘れた
        </Link>

        <Button type="submit" width={284} className="auth-submit">
          ログイン
        </Button>
      </form>

      <SocialAuthButtons />

      <Button width={351} className="auth-alt-action" onClick={() => navigate('/signup')}>
        新規登録をする
      </Button>
    </AuthLayout>
  )
}
