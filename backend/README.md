# kurumo backend

Go 製の HTTP API サーバー。標準ライブラリ（`net/http` + `log/slog`）のみで構成。

## 必要環境

- Go 1.23 以上

## 起動

```sh
cd backend
make run
```

デフォルトで `http://localhost:8080` を listen する。

```sh
curl http://localhost:8080/healthz
# {"status":"ok","time":"2026-08-08T00:00:00Z"}
```

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

## 構成

```
backend/
├── cmd/server/          エントリポイント（起動・graceful shutdown）
└── internal/
    ├── config/          環境変数からの設定読み込み
    ├── handler/         HTTP ハンドラ・JSON レスポンス補助
    └── server/          ルーティング・middleware（logging / recovery）
```

エンドポイントを追加する場合は `internal/handler` にハンドラを作り、
`internal/server/server.go` の `New` でルートを登録する。
