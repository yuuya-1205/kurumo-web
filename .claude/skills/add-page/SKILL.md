---
name: add-page
description: kurumo-web の frontend に画面（ページ）を追加するときの手順。pages/ への配置、components/ への切り出し判断、tokens.css の変数利用、src/App.tsx へのルート登録、遷移の書き方までを揃える。「画面を追加」「ページを作る」「〇〇画面を実装」といった依頼で使う。
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

**画面ごとに必ず 1 枚作るわけではない。** 2 パターンある。

| 状況 | 置き方 |
| --- | --- |
| 単独の画面 | `XxxPage.tsx` と `XxxPage.css` を同名で対にし、`.tsx` の先頭で import する |
| 機能でまとまる画面群 | **レイアウト部品の CSS に寄せる**。画面側は CSS を持たない |

認証まわりの 6 画面は見た目が揃っているため、共通のスタイルを `AuthLayout.css` に
集約し、各画面は `AuthLayout` でラップするだけにしてある（`.auth-form`, `.auth-link`,
`.field-row` などはすべてここ）。画面ごとに CSS を分けると同じ指定が散らばるため。

**新しい画面を機能グループに足すときは、まず既存のレイアウト部品の CSS で足りるかを見る。**
その画面だけの見た目が要る場合に限って `XxxPage.css` を作る。

**色・寸法・フォントは `src/styles/tokens.css` の変数を使う。生の hex を書かない。**
必要な値が無い場合は tokens.css に足してから使う（値の出どころは Figma）。

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

部品を新しく作る場合は `Xxx.tsx` + `Xxx.css` の同名ペア、named export。
props は `ComponentProps<'input'>` などを拡張し、余りは `{...props}` で流す。

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
- [ ] 生の hex を書かず tokens.css の変数を使った
- [ ] `react-router` から import している（`react-router-dom` ではない）
- [ ] 入力欄に `name` / `autoComplete` を付けた
- [ ] `npm run lint && npm run build` が通る
