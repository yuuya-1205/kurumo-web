# kurumo frontend

React + TypeScript + Vite で構成したフロントエンド。

## 必要環境

- Node.js 22（`.nvmrc` で固定。`nvm use` で切り替わる）

Vite 8 は Node `>=20.19` を要求するため、Node 18 では起動しない。

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
│   ├── api/health.ts   エンドポイント定義と疎通確認の fetch
│   ├── App.tsx         疎通確認の画面
│   └── App.css
└── vite.config.ts      dev サーバーの proxy 設定
```
