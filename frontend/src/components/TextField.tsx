import { useId, useState, type ComponentProps } from 'react'
import eyeOff from '../assets/brand/eye-off.svg'

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string
  /** ラベルの後ろに続く注釈（例: ※ひらがな・カタカナ・半角英数字6文字まで） */
  note?: string
  /** プロフィール入力のようにラベルが 12px の画面で使う */
  compact?: boolean
}

const fieldClass = 'flex w-full flex-col gap-2'

/*
 * ラベルの行送りは Figma の高さに合わせる（既定の行送りだと全体が下にずれる）。
 * 通常 16px/19px、compact は 12px/15px。どちらもラベル上端から入力上端までが Figma と揃う。
 */
const labelClass = 'font-latin font-bold text-accent-300'
const labelSize = { normal: 'text-[16px] leading-[19px]', compact: 'text-[12px] leading-[15px]' }

/* 枠線込みで 56px に収めるため、上下の padding は 16px ではなく 15px */
const inputClass =
  'box-border w-full min-h-[var(--auth-control-height)] px-4 py-[15px] ' +
  'border border-gray-400 rounded-field bg-back ' +
  'font-latin text-[16px] font-medium leading-6 text-text-base ' +
  'placeholder:text-gray-400 ' +
  'focus-visible:outline-2 focus-visible:outline-primary-300 focus-visible:-outline-offset-1'

function Label({ id, label, note, compact }: { id: string } & Pick<TextFieldProps, 'label' | 'note' | 'compact'>) {
  return (
    <label className={`${labelClass} ${compact ? labelSize.compact : labelSize.normal}`} htmlFor={id}>
      {label}
      {note && <span className="ml-1 text-[11px] font-normal">{note}</span>}
    </label>
  )
}

/** ラベル付きの入力欄。ラベルはアクセント色、枠は gray[400]。 */
export function TextField({ label, note, compact, className, ...props }: TextFieldProps) {
  const id = useId()

  return (
    <div className={className ? `${fieldClass} ${className}` : fieldClass}>
      <Label id={id} label={label} note={note} compact={compact} />
      <input id={id} className={inputClass} {...props} />
    </div>
  )
}

type PasswordFieldProps = Omit<TextFieldProps, 'type'>

/** 表示切り替えボタン付きのパスワード入力欄。 */
export function PasswordField({ label, note, compact, className, ...props }: PasswordFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)

  return (
    <div className={className ? `${fieldClass} ${className}` : fieldClass}>
      <Label id={id} label={label} note={note} compact={compact} />

      {/* 入力とボタンを横並びにするため、枠側を flex コンテナにする */}
      <div
        className={
          'box-border flex w-full min-h-[var(--auth-control-height)] items-center gap-2 px-4 ' +
          'border border-gray-400 rounded-field bg-back ' +
          'focus-within:outline-2 focus-within:outline-primary-300 focus-within:-outline-offset-1'
        }
      >
        <input
          id={id}
          className={
            'min-w-0 flex-1 border-none bg-transparent outline-none ' +
            'font-latin text-[16px] font-medium leading-6 tracking-[0.08em] text-gray-900'
          }
          type={visible ? 'text' : 'password'}
          {...props}
        />
        <button
          type="button"
          className="flex cursor-pointer items-center border-none bg-transparent p-0"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'パスワードを隠す' : 'パスワードを表示'}
        >
          {/* Figma 上のアイコン寸法は 24.16 x 18.325 */}
          <img src={eyeOff} alt="" width={24.16} height={18.325} />
        </button>
      </div>
    </div>
  )
}
