---
name: add-page
description: kurumo-web の frontend に画面（ページ）を追加するときの手順。pages/ への配置、components/ への切り出し判断、tokens.css の @theme トークン利用、src/App.tsx へのルート登録、遷移の書き方までを揃える。「画面を追加」「ページを作る」「〇〇画面を実装」といった依頼で使う。
---

# 画面の追加

frontend は `src/App.tsx` の `<Routes>` に画面を並べる構成。ルート登録を忘れると
実装しても到達できないので、最後まで通すこと。

デザインが Figma にある場合は、部品を作る前に **figma-to-component スキル**を先に見る。

## 1. 置き場所を決める

```
src/pages/HealthCheckPage.tsx    単独の画面
src/pages/auth/LoginPage.tsx     機能でまとまる画面群はサブディレクトリに
```

- ファイル名・コンポーネント名は **`XxxPage`** で揃える（`LoginPage`, `SignUpEmailPage`）
- **named export** にする（`export function LoginPage()`）。default export は使わない
- 開発者向けの画面は `/debug/` 配下に置く（`/debug/health` が前例）

## 2. CSS の持たせ方

**スタイルは Tailwind のクラスで書く。** CSS ファイルは作らない。

見た目が揃う画面群では、**共通のクラス列をレイアウト部品側の定数に寄せる。**
認証まわりの 6 画面は `AuthLayout.tsx` が `authFormClass` / `authMessageClass` を
export しており、各画面はそれを使うだけにしてある。画面ごとに同じクラス列を
書き写すと、後から間隔を変えるときに漏れるため。

**新しい画面を機能グループに足すときは、まず既存の定数で足りるかを見る。**

```tsx
import { AuthLayout, authFormClass } from '../../components/AuthLayout'

<form className={authFormClass} onSubmit={handleSubmit}>
```

足りない場合は、**その画面のモジュールスコープに定数を作って名前を付ける。**
JSX に長いクラス列を直接並べない。理由もコメントに残す。

```tsx
/*
 * プロフィール入力はフォーム幅もラベルも他画面と異なる。
 * 行間は Figma の 16px、姓と名の間は 29.777px。
 */
const profileFormClass = 'flex w-full flex-col items-stretch gap-4'
```

2 画面目で同じものが要るようになったら、`AuthLayout` 側へ移して export する。

**色・フォント・角丸は `src/styles/tokens.css` の `@theme` のトークンをクラスで使う**
（`bg-primary-300`, `font-jp`, `rounded-pill`）。**生の hex を書かない。**
必要な値が無い場合は `@theme` に足してから使う（値の出どころは Figma）。

余白は px 基準（`--spacing: 4px` なので `p-4` = 16px）。Figma の端数は
`gap-[29.777px]` のように任意値でそのまま入れ、出どころをコメントに残す。

## 3. 部品を使う / 切り出す

既存の部品を先に確認する。`src/components/` に以下がある。

| 部品 | 用途 |
| --- | --- |
| `AuthLayout` | ログイン・新規登録の共通枠（ヘッダー + ロゴ + 本文） |
| `Button` | 角丸ピル型のボタン。`width` を px で渡す |
| `TextField` / `PasswordField` | ラベル付き入力欄。パスワードは表示切替つき |
| `SocialAuthButtons` | ソーシャルログインのボタン群 |
| `Logo` | ロゴ。`width` と `variant` を取る |

**切り出しの基準：1 画面でしか使わないなら `pages/` 側に置いたままでよい。**
2 つ目の利用が出た時点で `src/components/` へ移す。先回りして共通化しない。

部品を新しく作る場合は `Xxx.tsx` 1 ファイル、named export。
props は `ComponentProps<'input'>` などを拡張し、余りは `{...props}` で流す。
呼び出し側が見た目を足せるよう `className` を受け取って末尾に連結する。

## 4. 画面を書く

`src/pages/auth/LoginPage.tsx` が一番参考になる。

- レイアウト部品でラップする（認証系なら `AuthLayout`）
- フォームは `<form onSubmit={handleSubmit}>`。ハンドラの先頭で `e.preventDefault()`
- **API がまだ無い場合は、その旨をコメントに残す**
  ```tsx
  // API は未接続。今は画面遷移だけ行う。
  ```
  握りつぶした `handleSubmit` を無言で置かない
- 入力欄には `name` と `autoComplete` を付ける（`email`, `current-password`, `new-password`）

## 5. 遷移

**import 元は `react-router`。`react-router-dom` ではない**（v8 で統合された）。

```tsx
import { Link, useNavigate } from 'react-router'
```

- ユーザーが押して移動するリンクは `<Link to="...">`
- 処理の後に移動する場合は `useNavigate()`
- リダイレクトは `<Navigate to="..." replace />`

## 6. ルート登録

`src/App.tsx` の `<Routes>` に追加する。**ここが漏れやすい。**

```tsx
<Route path="/signup/password" element={<SignUpPasswordPage />} />
```

- パスは機能ごとに階層を揃える（`/signup`, `/signup/password`, `/signup/done`）
- import は既存の並びに合わせてアルファベット順
- 開発者向けページには理由をコメントで書く

## 7. 確認

```sh
cd frontend && npm run lint && npm run build
```

`nvm use` を忘れずに。実際にブラウザで見る場合は `npm run dev` で
`http://localhost:5173` を開き、追加したパスへ遷移して確認する。

## 最後の確認

- [ ] `src/App.tsx` にルートを登録した
- [ ] 生の hex を書かず tokens.css の @theme トークンをクラスで使った
- [ ] `react-router` から import している（`react-router-dom` ではない）
- [ ] 入力欄に `name` / `autoComplete` を付けた
- [ ] `npm run lint && npm run build` が通る
