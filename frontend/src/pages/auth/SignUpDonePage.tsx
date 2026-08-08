import { useNavigate } from 'react-router'
import { AuthLayout, authMessageClass } from '../../components/AuthLayout'
import { Button } from '../../components/Button'

/** 登録完了画面。 */
export function SignUpDonePage() {
  const navigate = useNavigate()

  return (
    <AuthLayout>
      <p className={authMessageClass}>
        アカウントが登録されました。登録されたメールアドレスに登録情報をお送りしました。
      </p>
      {/* ここまで来た時点でログイン済みなので、ログイン画面ではなくホーム画面へ送る */}
      <Button width={284} className="mt-6" onClick={() => navigate('/home', { replace: true })}>
        トップに戻る
      </Button>
    </AuthLayout>
  )
}
