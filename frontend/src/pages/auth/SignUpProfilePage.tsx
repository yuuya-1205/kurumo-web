import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'

/*
 * プロフィール入力はフォーム幅もラベルも他画面と異なる。
 * 行間は Figma の 16px、姓と名の間は 29.777px。
 */
const profileFormClass = 'flex w-full flex-col items-stretch gap-4'

/** 本登録。予約時に使う情報を入力する。 */
export function SignUpProfilePage() {
  const navigate = useNavigate()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    navigate('/signup/done')
  }

  return (
    <AuthLayout width={660} lead="入力した情報は予約時などに利用されます。">
      <form className={profileFormClass} onSubmit={handleSubmit}>
        {/* Figma 上の姓・名の間隔は 29.777px */}
        <div className="flex w-full gap-[29.777px]">
          <TextField compact label="姓" name="lastName" autoComplete="family-name" placeholder="前田" />
          <TextField compact label="名" name="firstName" autoComplete="given-name" placeholder="陽子" />
        </div>

        <TextField
          compact
          label="ニックネーム"
          note="※ひらがな・カタカナ・半角英数字6文字まで"
          name="nickname"
          maxLength={6}
          placeholder="マヨこ"
        />
        <TextField
          compact
          label="電話番号"
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder="0622345678"
        />
        <TextField
          compact
          label="郵便番号"
          name="postalCode"
          autoComplete="postal-code"
          inputMode="numeric"
          placeholder="0001234"
        />
        <TextField
          compact
          label="住所"
          name="address1"
          autoComplete="address-line1"
          placeholder="大阪府堺市XXXXXX"
        />
        <TextField
          compact
          label="住所02"
          name="address2"
          autoComplete="address-line2"
          placeholder="XXXX1-2-3あのビル2F"
        />

        <p className="font-latin text-[16px] leading-[18px] text-gray-900">
          登録することで、
          <Link className="text-accent-300 underline [text-underline-position:from-font]" to="/privacy">
            プライバシーポリシー
          </Link>{' '}
          と{' '}
          <Link className="text-accent-300 underline [text-underline-position:from-font]" to="/terms">
            利用規約
          </Link>{' '}
          に同意したことになります。
        </p>

        <Button type="submit" width={284} className="self-center mt-5">
          アカウントを作成
        </Button>
      </form>
    </AuthLayout>
  )
}
