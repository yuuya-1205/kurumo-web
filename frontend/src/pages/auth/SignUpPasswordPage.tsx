import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { FieldErrors } from '../../api/auth'
import { AuthLayout, authFormClass } from '../../components/AuthLayout'
import { useAuth } from '../../components/AuthContext'
import { Button } from '../../components/Button'
import { FormError } from '../../components/FormError'
import { PasswordField, TextField } from '../../components/TextField'

/** 1 画面目から渡ってきたメールアドレスを取り出す。直接開かれた場合は空。 */
function emailFromState(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'email' in state) {
    const email = (state as { email?: unknown }).email
    if (typeof email === 'string') {
      return email
    }
  }
  return ''
}

/** メールアドレスとパスワードを設定する。ここで POST /auth/signup を叩く。 */
export function SignUpPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signUp } = useAuth()

  // 1 画面目の入力を初期値にする。直接来た場合は空欄から始まる。
  const [email, setEmail] = useState(() => emailFromState(location.state))
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<FieldErrors | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) {
      return
    }

    setError(null)
    setFields(null)

    // 確認欄の一致は backend が見ないので、ここで確かめる。
    if (password !== confirmation) {
      setError('パスワードと確認用のパスワードが一致しません。')
      return
    }

    setSubmitting(true)
    const result = await signUp(email, password)
    if (result.ok) {
      /*
       * 本来はここで確認メールを送り /signup/sent（確認メール送信済み画面）を
       * 挟む流れだが、メール送信の仕組みがまだ無いので飛ばしてプロフィール入力へ進む。
       * 画面とルート（/signup/sent）は仕組みが入ったときに戻せるよう残してある。
       */
      navigate('/signup/profile', { replace: true })
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
          note="※8文字以上"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          label="パスワードの確認"
          name="passwordConfirmation"
          autoComplete="new-password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />

        <FormError message={error} fields={fields} />

        {/* 送信中は disabled にして二重送信を防ぐ */}
        <Button type="submit" width={284} className="mt-[13px]" disabled={submitting}>
          {submitting ? '登録中…' : '確認メールを送信する'}
        </Button>
      </form>
    </AuthLayout>
  )
}
