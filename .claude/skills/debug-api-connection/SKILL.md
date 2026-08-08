---
name: debug-api-connection
description: kurumo-web で frontend から backend の API が呼べないときの切り分け手順。サーバーが起動しない、リクエストが届かない、CORS エラー、500、401、DB につながらない、といった症状を外側から順に潰す。「API がつながらない」「Failed to fetch」「サーバーが起動しない」「500 が返る」といった相談で使う。
---

# API がつながらないときの切り分け

**外側から内側へ順に潰す。** ブラウザ → dev サーバー（proxy）→ Go サーバー → DB。
途中を飛ばすと、原因の層を取り違える。

## 症状から引く

| 症状 | 見るところ |
| --- | --- |
| `npm install` / `npm run dev` が即座に止まる | [1. Node のバージョン](#1-node-のバージョン) |
| `make run` が起動せず終了する | [2. サーバーが起動しない](#2-サーバーが起動しない) |
| ブラウザで `Failed to fetch` / status が `null` | [3. リクエストが届いていない](#3-リクエストが届いていない) |
| CORS エラー | [4. proxy を経由していない](#4-proxy-を経由していない) |
| 404 なのにパスは合っている | [5. 404 と 405](#5-404-と-405) |
| 500 が返る | [6. 500 が返る](#6-500-が返る) |
| `/healthz` は 200 だが `/healthz/db` が 503 | [7. DB につながらない](#7-db-につながらない) |
| 401 が返る | [8. 401 が返る](#8-401-が返る) |
| 400 が返る | [9. 400 が返る](#9-400-が返る) |

## まず状況を掴む

frontend の **`/debug/health`** が疎通確認の画面。backend の各エンドポイントを実際に
叩いて、ステータス・所要時間・レスポンス body を出す。ここで通るなら経路は生きている。

コマンドで確かめるなら backend を直接叩く。**proxy を挟まないぶん切り分けが速い。**

```bash
curl -i http://localhost:8080/healthz
```

## 1. Node のバージョン

Node 22 が要る。**`nvm use` を忘れているだけ**のことが多い。

```bash
node -v
```

満たしていないと `npm install` は `.npmrc` の `engine-strict` で、`npm run dev` は
`scripts/check-node.mjs` で止まる。**これは意図した挙動なので、`--force` や
`engines` の緩和で迂回しない。**

## 2. サーバーが起動しない

`make run` がすぐ終わる場合、まずログの 1 行目を読む。

- **`JWT_SECRET is required`** — 起動前の `cfg.Validate()` で止めている。
  既定の署名鍵があると誰でもなりすませるトークンを作れるため、あえて落としている。
  `backend/.env` に `JWT_SECRET` を書く（`.env.example` を参照）
- **`address already in use`** — 前のプロセスが残っている

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

**`make run` は `.env` があれば読み込む。** `.env` を作っていない場合、DB のパスワードも
`JWT_SECRET` も無い状態になる。

## 3. リクエストが届いていない

ブラウザのコンソールに `Failed to fetch`、`/debug/health` の status が `null` の場合、
**サーバーまで到達していない**（レスポンスが無いので status が付かない）。

順に確かめる。

1. Go サーバーが動いているか — `curl -i http://localhost:8080/healthz`
2. dev サーバーが動いているか — `http://localhost:5173` が開くか
3. proxy の転送先 — `VITE_PROXY_TARGET`（既定 `http://localhost:8080`）が
   実際の listen ポートと合っているか。`PORT` を変えたなら両方を揃える

**backend を再起動したあと dev サーバーの再起動は要らない**（proxy は都度転送する）。

## 4. proxy を経由していない

**CORS エラーが出たら、まずこれを疑う。**

正しい経路ではブラウザから見て同一オリジンになるので、**backend に CORS の設定は要らない**。

```
ブラウザ → http://localhost:5173/api/*  →（Vite proxy）→ http://localhost:8080/*
```

`VITE_API_BASE_URL` を `http://localhost:8080` のように**直接向けると別オリジンになり、
CORS で落ちる**。`.env` を確認し、通常は未設定（既定の `/api`）にしておく。

**backend 側に CORS 設定を足して解決しない。** 経路を直す。

## 5. 404 と 405

`engine.HandleMethodNotAllowed = true` にしてあるので、**パスは存在するがメソッドが
違う場合は 405** が返る。405 が出たらパスではなくメソッドを疑う。

404 なら、`internal/server/server.go` の `Route` に登録されているかを見る。
パスパラメータは Gin の形式（`/users/:id`）。

## 6. 500 が返る

**レスポンスには `internal server error` としか出ない。** 接続先や SQL が漏れないよう、
詳細は `slog` でサーバーログにのみ残す設計。**必ずサーバーのログを見る。**

よくある原因。

- **スキーマが未適用** — テーブルが無い。`make migrate` を実行する（DB の作成も初回のみ必要）
- モデルとテーブルの食い違い — カラムを足したのに `AutoMigrate` に反映していない。
  **`AutoMigrate` は追加しかしない**ので、削除・リネームは反映されない

```bash
cd backend && make migrate
```

## 7. DB につながらない

**DB が落ちていてもサーバーは起動する。** 状態は `/healthz/db` で見る（失敗時 503）。

```bash
curl -i http://localhost:8080/healthz/db
```

確かめる順。

1. MySQL が動いているか — `lsof -nP -iTCP:3306 -sTCP:LISTEN`
2. `backend/.env` の `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`
3. データベースが作られているか（初回は `CREATE DATABASE` が要る）

**失敗の詳細はレスポンスに出ない。** サーバーログを見る。
発行される SQL まで見たい場合は `DB_LOG_LEVEL=info` にする。

## 8. 401 が返る

`/auth/me` など `RequireAuth()` が付いたルートで起きる。

- **トークンが送られていない** — `api/token.ts` の `readToken()` が `null`。
  未ログイン、ログアウト済み、あるいはプライベートモードで `localStorage` を触れない
- **トークンの期限切れ** — `JWT_EXPIRY_HOURS`（既定 24 時間）
- **`JWT_SECRET` を変えた** — 変更前に発行したトークンは検証に通らない。
  一度ログインし直す

`/auth/login` 自体が 401 の場合は、メールアドレスかパスワードの誤り。
**どちらが違うかはレスポンスから分からない**（利用者の存在を漏らさないため）。

## 9. 400 が返る

- **`fields` が付いている** — 検証エラー。どの入力が何で弾かれたかが入っている
- **`invalid JSON body`** — JSON が壊れている、または**未知のフィールドが含まれている**。
  `DisallowUnknownFields()` を有効にしてあるため、綴り間違いは黙って無視されず 400 になる。
  リクエストのキー名を確かめる
- **`id must be a positive integer`** — パスパラメータが数値でない、または 0

## 最後に確認すること

- [ ] `nvm use` した（Node 22）
- [ ] `backend/.env` がある（`JWT_SECRET` と DB のパスワード）
- [ ] `make migrate` を実行済み
- [ ] `VITE_API_BASE_URL` を未設定にしている（proxy 経由）
- [ ] 500 や 503 のときはサーバーログを読んだ
