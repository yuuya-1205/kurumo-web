import appleLogo from '../assets/brand/apple.png'
import googleLogo from '../assets/brand/google.png'

const buttonClass =
  'flex items-center justify-center gap-6 box-border w-[351px] max-w-full ' +
  'h-[var(--auth-control-height)] rounded-field ' +
  'font-latin text-[16px] font-bold cursor-pointer hover:brightness-[0.97]'

/**
 * Google / Apple でのログイン導線。
 * Figma では「または」の区切りとセットで置かれている。
 */
export function SocialAuthButtons() {
  return (
    // 直前のボタン下端から区切り線まで 56px（Figma: 606 → 662）
    <div className="mt-14 flex w-full flex-col items-center">
      {/* border-none を付けると border-style が none になり線が消えるので付けない */}
      <hr className="m-0 h-0 w-full border-t border-t-gray-900" />

      {/* 線 → キャプション → 最初のボタンが Figma では各 56px 間隔 */}
      <p className="my-14 font-latin text-[16px] font-bold leading-[19px] text-gray-900">または</p>

      <button type="button" className={`${buttonClass} border border-gray-900 bg-back text-gray-900`}>
        {/* Figma 上のアイコン寸法は 23.531 x 24 */}
        <img src={googleLogo} alt="" width={23.531} height={24} />
        Googleでログイン
      </button>

      <button
        type="button"
        className={`${buttonClass} mt-4 border-none bg-gray-900 text-text-inverse`}
      >
        {/* Figma 上のアイコン寸法は 23 x 24 */}
        <img src={appleLogo} alt="" width={23} height={24} />
        Appleでログイン
      </button>
    </div>
  )
}
