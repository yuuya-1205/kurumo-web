import { useNavigate } from 'react-router'
import { AuthLayout, authMessageClass } from '../../components/AuthLayout'
import { Button } from '../../components/Button'

/** 認証メールを送った旨を伝える画面。 */
export function SignUpSentPage() {
  const navigate = useNavigate()

  return (
    <AuthLayout>
      <p className={authMessageClass}>
        メールアドレスに認証メールを送信しました。メールを確認してアカウント登録をお願いします。
      </p>
      <Button width={284} className="mt-6" onClick={() => navigate('/login')}>
        トップに戻る
      </Button>
    </AuthLayout>
  )
}
