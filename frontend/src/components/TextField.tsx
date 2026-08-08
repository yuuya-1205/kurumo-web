import { useId, useState, type ComponentProps } from 'react'
import eyeOff from '../assets/brand/eye-off.svg'
import './TextField.css'

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string
  /** ラベルの後ろに続く注釈（例: ※ひらがな・カタカナ・半角英数字8文字まで） */
  note?: string
}

/** ラベル付きの入力欄。ラベルはアクセント色、枠は gray[400]。 */
export function TextField({ label, note, className, ...props }: TextFieldProps) {
  const id = useId()

  return (
    <div className={className ? `field ${className}` : 'field'}>
      <label className="field-label" htmlFor={id}>
        {label}
        {note && <span className="field-note">{note}</span>}
      </label>
      <input id={id} className="field-input" {...props} />
    </div>
  )
}

type PasswordFieldProps = Omit<TextFieldProps, 'type'>

/** 表示切り替えボタン付きのパスワード入力欄。 */
export function PasswordField({ label, note, className, ...props }: PasswordFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)

  return (
    <div className={className ? `field ${className}` : 'field'}>
      <label className="field-label" htmlFor={id}>
        {label}
        {note && <span className="field-note">{note}</span>}
      </label>
      <div className="field-input field-input-with-action">
        <input
          id={id}
          className="field-inner-input"
          type={visible ? 'text' : 'password'}
          {...props}
        />
        <button
          type="button"
          className="field-action"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'パスワードを隠す' : 'パスワードを表示'}
        >
          <img src={eyeOff} alt="" width={24.16} height={18.325} />
        </button>
      </div>
    </div>
  )
}
