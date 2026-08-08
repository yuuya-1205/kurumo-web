import appleLogo from '../assets/brand/apple.png'
import googleLogo from '../assets/brand/google.png'
import './SocialAuthButtons.css'

/**
 * Google / Apple でのログイン導線。
 * Figma では「または」の区切りとセットで置かれている。
 */
export function SocialAuthButtons() {
  return (
    <div className="social-auth">
      <hr className="social-auth-divider" />
      <p className="social-auth-caption">または</p>

      <button type="button" className="social-button social-button-google">
        {/* Figma 上のアイコン寸法は 23.531 x 24 */}
        <img src={googleLogo} alt="" width={23.531} height={24} />
        Googleでログイン
      </button>

      <button type="button" className="social-button social-button-apple">
        {/* Figma 上のアイコン寸法は 23 x 24 */}
        <img src={appleLogo} alt="" width={23} height={24} />
        Appleでログイン
      </button>
    </div>
  )
}
