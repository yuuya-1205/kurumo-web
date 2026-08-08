# kurumo

frontend（React + TypeScript + Vite）と backend（Go）を 1 つのリポジトリに置いたモノレポ。

ルートにビルド設定は無い。作業は `frontend/` か `backend/` に入ってから行う。

## 構成

```
kurumo-web/
├── frontend/   React + TypeScript + Vite
└── backend/    Go 製の HTTP API サーバー
```

| ディレクトリ | README | 実装するときの判断 |
| --- | --- | --- |
| [frontend/](frontend/) | [frontend/README.md](frontend/README.md) | [frontend/AGENTS.md](frontend/AGENTS.md) |
| [backend/](backend/) | [backend/README.md](backend/README.md) | [backend/AGENTS.md](backend/AGENTS.md) |

両方に関わる約束事は [AGENTS.md](AGENTS.md) にある。

## 起動

backend と frontend を別々のシェルで起動する。

```sh
cd backend
make run
```

```sh
cd frontend
nvm use
npm install
npm run dev
```

frontend は `http://localhost:5173`、backend は `http://localhost:8080` で起動する。

初回は backend のデータベース作成とスキーマ適用が要る。frontend は Node 22 が要る。
それぞれの手順は上記の README にある。

## 2 つの間のつながり

ブラウザ → Vite dev サーバー → Go サーバー、という経路になる。dev サーバーの proxy が
`/api/*` を `http://localhost:8080` へ転送する（[frontend/vite.config.ts](frontend/vite.config.ts)）。

ブラウザから見ると同一オリジンになるので、**backend 側に CORS の設定は要らない。**
CORS エラーが出た場合は、proxy を経由しているか（`VITE_API_BASE_URL` が backend の
URL に直接向いていないか）をまず疑う。

frontend の `/debug/health` は、backend の各エンドポイントを実際に叩いて結果を出す
疎通確認の画面。対象の一覧は [frontend/src/api/health.ts](frontend/src/api/health.ts) の
`ENDPOINTS` にあり、**backend にエンドポイントを追加したらここにも足す。**

## 変更後の確認

片方だけ触った場合はそちらだけでよい。

```sh
cd backend  && make fmt && make vet && make test
cd frontend && npm run lint && npm run build
```
