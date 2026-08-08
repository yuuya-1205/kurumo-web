# kurumo frontend

React + TypeScript + Vite で構成したフロントエンド。

## 必要環境

- Node.js 22（`.nvmrc` で固定。`nvm use` で切り替わる）

Vite 8 は Node `>=20.19` を要求するため、Node 18 では起動しない。技術的な下限は
`package.json` の `engines`（`>=20.19`）で、`.nvmrc` の 22 は開発時に揃えるバージョン。

満たしていない場合は次の 2 箇所で止まる。`nvm use` を忘れても、原因の分かりにくい
エラー（vite が `node:util` の `styleText` を見つけられない）にはならない。

- `npm install` — `.npmrc` の `engine-strict=true` により失敗する
- `npm run dev` / `build` / `preview` — 実行前に [scripts/check-node.mjs](scripts/check-node.mjs) が確認する

## 起動

```sh
cd frontend
nvm use
npm install
npm run dev
```

`http://localhost:5173` で起動する。API 疎通確認の画面が出るので、
ボタンを押すと backend の各エンドポイントを叩いて結果を表示する。

backend も併せて起動しておく。

```sh
cd backend && make run
```

## API の接続先

dev サーバーの proxy が `/api/*` を Go サーバー（既定で `http://localhost:8080`）へ
転送する。ブラウザから見ると同一オリジンになるので、backend 側に CORS の設定は要らない。

| 変数 | 既定値 | 内容 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | API のベース URL。backend を直接叩く場合に設定する（backend 側の CORS 対応が必要） |
| `VITE_PROXY_TARGET` | `http://localhost:8080` | dev サーバーの proxy 転送先 |

設定する場合は `.env.example` をコピーして `.env` を作る。

## ログイン状態の持ち方

セッションは JWT（Bearer トークン）。`POST /auth/login` と `POST /auth/signup` が返す
トークンを **localStorage** に保存し、`Authorization: Bearer <token>` を付けて
`/auth/me` を叩く。

| 置き場所 | 内容 |
| --- | --- |
| [src/api/auth.ts](src/api/auth.ts) | `/auth/*` の呼び出し。失敗は例外ではなく戻り値（`ApiResult`）で返す |
| [src/api/token.ts](src/api/token.ts) | トークンの保存・読み出し・削除。localStorage を触るのはここだけ |
| [src/components/AuthProvider.tsx](src/components/AuthProvider.tsx) | ログイン状態を Context で共有（状態管理ライブラリは使わない） |
| [src/components/RequireAuth.tsx](src/components/RequireAuth.tsx) | ログインが要る画面を包む。未ログインなら `/login` へ送る |

起動時にトークンが残っていれば `GET /auth/me` で確認し、通ったときだけログイン中として
扱う（401 ならトークンを捨てる）。確認が終わるまでは `loading` 状態で、`RequireAuth` は
何も描かない。リロードしてもログイン状態は続く。

localStorage は JavaScript から読めるため、XSS を許すとトークンを持ち出されうる。
承知のうえでの選択で、詳細と将来 HttpOnly Cookie へ移す場合の話は
[src/api/token.ts](src/api/token.ts) の冒頭にある。

## 疎通確認の対象を増やす

backend にエンドポイントを追加したら、[src/api/health.ts](src/api/health.ts) の
`ENDPOINTS` に 1 件足すとボタンと結果表示が増える。

```ts
{
  id: 'users',
  method: 'GET',
  path: '/users',
  label: 'ユーザー一覧',
  description: '登録済みユーザーを返す',
}
```

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | dev サーバー起動 |
| `npm run build` | 型チェック（`tsc -b`）とビルド |
| `npm run preview` | ビルド結果の確認 |
| `npm run lint` | oxlint |

## 構成

```
frontend/
├── src/
│   ├── api/            backend との通信
│   ├── components/     画面をまたいで使う部品
│   ├── pages/          画面単位のコンポーネント
│   ├── styles/         デザイントークン（Tailwind の @theme）
│   ├── assets/brand/   Figma から書き出したロゴ・アイコン
│   └── App.tsx         ルーティング定義
└── vite.config.ts      dev サーバーの proxy 設定
```

スタイルは Tailwind CSS v4。設定ファイルは無く、テーマは
[src/styles/tokens.css](src/styles/tokens.css) の `@theme` にある（値の出どころは Figma）。
