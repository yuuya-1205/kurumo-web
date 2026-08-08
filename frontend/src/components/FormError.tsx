import type { FieldErrors } from '../api/auth'

type FormErrorProps = {
  /** 全体のエラーメッセージ。backend が返した文字列をそのまま渡してよい */
  message: string | null
  /** フィールド単位の検証エラー（400 の fields） */
  fields?: FieldErrors | null
}

const messageClass = 'w-full font-latin text-[14px] leading-5 text-error'

/*
 * backend のメッセージは英語なので、既知のものは日本語にして出す。
 * 契約（ステータスとメッセージの対応）に無いものはそのまま出す。
 */
const JAPANESE: Record<string, string> = {
  'validation failed': '入力内容を確認してください。',
  'email or password is incorrect': 'メールアドレスまたはパスワードが違います。',
  unauthorized: 'ログインの有効期限が切れました。もう一度ログインしてください。',
  'email already taken': 'このメールアドレスは既に登録されています。',
}

/** 入力欄の名前を画面のラベルに合わせる。 */
const FIELD_LABELS: Record<string, string> = {
  email: 'メールアドレス',
  password: 'パスワード',
  name: 'お名前',
}

/** フォームの下に出すエラー表示。認証まわりの 3 画面で使う。 */
export function FormError({ message, fields }: FormErrorProps) {
  const entries = fields ? Object.entries(fields) : []

  if (message === null && entries.length === 0) {
    return null
  }

  return (
    <div className="flex w-full flex-col gap-1" role="alert">
      {message !== null && <p className={messageClass}>{JAPANESE[message] ?? message}</p>}
      {entries.map(([field, text]) => (
        <p className={messageClass} key={field}>
          {FIELD_LABELS[field] ?? field}: {text}
        </p>
      ))}
    </div>
  )
}
