import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { AuthLayout, authFormClass } from '../../components/AuthLayout'
import { Button } from '../../components/Button'
import { SocialAuthButtons } from '../../components/SocialAuthButtons'
import { TextField } from '../../components/TextField'

/** 新規登録の入り口。メールアドレスだけ入力する。 */
export function SignUpEmailPage() {
  const navigate = useNavigate()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    navigate('/signup/password')
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

        <Button type="submit" width={284} className="mt-[13px]">
          確認メールを送信する
        </Button>
      </form>

      <SocialAuthButtons />
    </AuthLayout>
  )
}
