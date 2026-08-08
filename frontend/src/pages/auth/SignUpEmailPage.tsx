import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { AuthLayout, authFormClass } from '../../components/AuthLayout'
import { Button } from '../../components/Button'
import { SocialAuthButtons } from '../../components/SocialAuthButtons'
import { TextField } from '../../components/TextField'

/** 新規登録の入り口。メールアドレスだけ入力する。 */
export function SignUpEmailPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // 次の画面で同じメールアドレスを入力し直さずに済むよう、遷移時に渡す。
    // 実際に登録するのは次の画面の POST /auth/signup。
    navigate('/signup/password', { state: { email } })
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" width={284} className="mt-[13px]">
          確認メールを送信する
        </Button>
      </form>

      <SocialAuthButtons />
    </AuthLayout>
  )
}
