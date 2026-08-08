/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** backend API のベース URL。未設定なら dev proxy 経由の /api を使う。 */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
