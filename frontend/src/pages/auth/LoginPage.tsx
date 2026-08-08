import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import type { FieldErrors } from '../../api/auth'
import { AuthLayout, authFormClass } from '../../components/AuthLayout'
import { useAuth } from '../../components/AuthContext'
import { Button } from '../../components/Button'
import { FormError } from '../../components/FormError'
import { SocialAuthButtons } from '../../components/SocialAuthButtons'
import { PasswordField, TextField } from '../../components/TextField'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  // 入力値を API に渡すため、この画面の入力欄は制御コンポーネントにする。
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<FieldErrors | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) {
      return
    }

    setSubmitting(true)
    setError(null)
    setFields(null)

    const result = await signIn(email, password)
    if (result.ok) {
      // 戻るボタンでログイン画面に戻らないよう置き換える
      navigate('/home', { replace: true })
      return
    }

    setError(result.error)
    setFields(result.fields)
    setSubmitting(false)
  }

  return (
    <AuthLayout>
      <form className={authFormClass} onSubmit={(e) => void handleSubmit(e)}>
        <TextField
          label="メールアドレス"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="caruser29@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="パスワード"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* 位置は Figma 基準。form の gap 19px に足りない分をマージンで補う */}
        <Link
          className="self-end mt-[5px] font-latin text-[16px] leading-[19px] text-accent-300 underline [text-underline-position:from-font]"
          to="/password-reset"
        >
          パスワードを忘れた
        </Link>

        <FormError message={error} fields={fields} />

        {/* 送信中は disabled にして二重送信を防ぐ */}
        <Button type="submit" width={284} className="mt-[13px]" disabled={submitting}>
          {submitting ? 'ログイン中…' : 'ログイン'}
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
