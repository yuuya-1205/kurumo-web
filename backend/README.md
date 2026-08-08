# kurumo backend

Go 製の HTTP API サーバー。標準ライブラリ（`net/http` + `log/slog`）のみで構成。

## 必要環境

- Go 1.23 以上

## 起動

```sh
cd backend
cp .env.example .env   # DB_PASSWORD を埋める
make run
```

デフォルトで `http://localhost:8080` を listen する。`make run` は `.env` があれば
自動で読み込む（無くても既定値で起動する）。

```sh
curl http://localhost:8080/healthz
# {"status":"ok","time":"2026-08-08T00:00:00Z"}

curl http://localhost:8080/healthz/db
# {"status":"ok","database":"kurumo","in_use":0,"idle":1}
```

## エンドポイント

| メソッド | パス | 内容 |
| --- | --- | --- |
| GET | `/healthz` | サーバーの生存確認。常に 200 |
| GET | `/healthz/db` | DB への疎通確認。失敗時は 503 |

`/healthz/db` は接続できない場合 503 を返すため、readiness 判定に使える。
接続情報が漏れないよう、失敗の詳細はレスポンスに含めずサーバーログにのみ残す。

DB が起動していなくてもサーバーは起動する。接続状態は `/healthz/db` で確認する。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `make run` | サーバー起動 |
| `make build` | `bin/server` にビルド |
| `make test` | テスト実行 |
| `make fmt` / `make vet` | フォーマット / 静的解析 |

## 環境変数

| 変数 | 既定値 | 内容 |
| --- | --- | --- |
| `PORT` | `8080` | listen ポート |
| `READ_TIMEOUT_SEC` | `10` | リクエスト読み取りタイムアウト（秒） |
| `WRITE_TIMEOUT_SEC` | `10` | レスポンス書き込みタイムアウト（秒） |
| `SHUTDOWN_TIMEOUT_SEC` | `15` | graceful shutdown の猶予（秒） |
| `DB_HOST` | `127.0.0.1` | MySQL のホスト |
| `DB_PORT` | `3306` | MySQL のポート |
| `DB_USER` | `root` | 接続ユーザー |
| `DB_PASSWORD` | （空） | 接続パスワード |
| `DB_NAME` | `kurumo` | 接続先データベース |
| `DB_MAX_OPEN_CONNS` | `25` | 最大接続数 |
| `DB_MAX_IDLE_CONNS` | `5` | アイドル接続の保持数 |
| `DB_CONN_MAX_LIFETIME_SEC` | `300` | 接続の最大生存時間（秒） |

## 構成

```
backend/
├── cmd/server/          エントリポイント（起動・graceful shutdown）
└── internal/
    ├── config/          環境変数からの設定読み込み
    ├── db/              MySQL 接続プールの構築・疎通確認
    ├── handler/         HTTP ハンドラ・JSON レスポンス補助
    └── server/          ルーティング・middleware（logging / recovery）
```

エンドポイントを追加する場合は `internal/handler` にハンドラを作り、
`internal/server/server.go` の `New` でルートを登録する。
