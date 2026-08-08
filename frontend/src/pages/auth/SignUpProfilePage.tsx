import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'

/** 本登録。予約時に使う情報を入力する。 */
export function SignUpProfilePage() {
  const navigate = useNavigate()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    navigate('/signup/done')
  }

  return (
    <AuthLayout width={660} lead="入力した情報は予約時などに利用されます。">
      <form className="auth-form auth-form-profile" onSubmit={handleSubmit}>
        <div className="field-row">
          <TextField label="姓" name="lastName" autoComplete="family-name" placeholder="前田" />
          <TextField label="名" name="firstName" autoComplete="given-name" placeholder="陽子" />
        </div>

        <TextField
          label="ニックネーム"
          note="※ひらがな・カタカナ・半角英数字6文字まで"
          name="nickname"
          maxLength={6}
          placeholder="マヨこ"
        />
        <TextField
          label="電話番号"
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder="0622345678"
        />
        <TextField
          label="郵便番号"
          name="postalCode"
          autoComplete="postal-code"
          inputMode="numeric"
          placeholder="0001234"
        />
        <TextField
          label="住所"
          name="address1"
          autoComplete="address-line1"
          placeholder="大阪府堺市XXXXXX"
        />
        <TextField
          label="住所02"
          name="address2"
          autoComplete="address-line2"
          placeholder="XXXX1-2-3あのビル2F"
        />

        <p className="auth-terms">
          登録することで、<Link to="/privacy">プライバシーポリシー</Link> と{' '}
          <Link to="/terms">利用規約</Link> に同意したことになります。
        </p>

        <Button type="submit" width={284} className="auth-submit">
          アカウントを作成
        </Button>
      </form>
    </AuthLayout>
  )
}
