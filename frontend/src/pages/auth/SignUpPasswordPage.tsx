import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout'
import { Button } from '../../components/Button'
import { PasswordField, TextField } from '../../components/TextField'

/** メールアドレスとパスワードを設定する。 */
export function SignUpPasswordPage() {
  const navigate = useNavigate()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    navigate('/signup/sent')
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
        <PasswordField label="パスワード" name="password" autoComplete="new-password" />
        <PasswordField
          label="パスワードの確認"
          name="passwordConfirmation"
          autoComplete="new-password"
        />

        <Button type="submit" width={284} className="auth-submit">
          確認メールを送信する
        </Button>
      </form>
    </AuthLayout>
  )
}
