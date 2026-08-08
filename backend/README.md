# kurumo backend

Go 製の HTTP API サーバー。ルーティングは Gin、DB アクセスは GORM、ログは `log/slog`。

## 必要環境

- Go 1.23 以上

## セットアップ

データベースを作る（初回のみ）。

```sh
mysql -u root -p -e "CREATE DATABASE kurumo_api CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
```

スキーマを適用する。

```sh
cd backend
cp .env.example .env   # DB_PASSWORD と JWT_SECRET を埋める
make migrate
```

## 起動

```sh
make run
```

デフォルトで `http://localhost:8080` を listen する。`make run` は `.env` があれば
自動で読み込む（他の項目は既定値で動くが、`JWT_SECRET` だけは必須。未設定だと
起動時に `JWT_SECRET is required` で終了する）。

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
| GET | `/users` | ユーザー一覧 |
| POST | `/users` | ユーザー作成。201 |
| GET | `/users/{id}` | ユーザー 1 件。存在しなければ 404 |
| PUT | `/users/{id}` | ユーザー更新。`name` と `email` の両方を置き換える |
| DELETE | `/users/{id}` | ユーザー削除（論理削除）。204 |
| POST | `/auth/signup` | 登録。`{email, password}` を受け取り 201 で `{token, user}` |
| POST | `/auth/login` | ログイン。`{email, password}` を受け取り 200 で `{token, user}` |
| GET | `/auth/me` | 本人の情報。要 Bearer トークン。200 で `{user}` |
| PATCH | `/auth/me` | 本人の `name` を更新。要 Bearer トークン。200 で `{user}` |

### エラーレスポンス

| ステータス | 条件 |
| --- | --- |
| 400 | JSON が不正、未知のフィールド、検証エラー、`id` が不正 |
| 401 | トークンが無い / 不正 / 期限切れ、またはログインの認証情報が違う |
| 404 | 対象のレコードが無い |
| 409 | メールアドレスが既に登録済み |
| 500 | 想定外のエラー。詳細はサーバーログのみに残す |

検証エラーは `fields` に理由が入る。

```json
{
  "error": "validation failed",
  "fields": { "email": "email is not a valid address" }
}
```

### 認証

セッションは **JWT（Bearer トークン）**。Cookie は使わない。

```sh
curl -X POST http://localhost:8080/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"tanaka@example.com","password":"password123"}'
# {"token":"eyJhbGci...","user":{"id":1,"name":"","email":"tanaka@example.com",...}}

curl http://localhost:8080/auth/me -H 'Authorization: Bearer eyJhbGci...'
```

- 署名は HS256。鍵は `JWT_SECRET`。**既定値は無く、未設定ならサーバーは起動しない。**
- 有効期限は `JWT_EXPIRY_HOURS`（既定 24 時間）。claims は `sub`（ユーザー ID）と `exp`。
- **失効（ログアウト・無効化）の仕組みは今のところ無い。** 発行済みのトークンは
  期限が切れるまで有効で、サーバー側から個別に無効化できない。必要になった時点で
  jti のブロックリストか、短命トークン + リフレッシュトークンの導入を検討する。
  `JWT_SECRET` を変えれば発行済みの全トークンが一括で無効になる。
- ログインの失敗は、メールアドレスが未登録でもパスワード違いでも同じ
  401 `email or password is incorrect` を返す。登録済みのアドレスを
  総当たりで割り出せないようにするため（アカウント列挙対策）。
- `POST /auth/signup` は `name` を受け取らない。登録フローが
  「メール + パスワード」→「プロフィール入力」の 2 段階のため、`name` は
  空文字で作成し、あとから `PATCH /auth/me` で設定する。
- パスワードは bcrypt でハッシュ化して保存する。8 文字以上・72 バイト以内
  （72 バイトは bcrypt の入力上限。超える分を黙って捨てず 400 にする）。

`/healthz/db` は接続できない場合 503 を返すため、readiness 判定に使える。
接続情報が漏れないよう、失敗の詳細はレスポンスに含めずサーバーログにのみ残す。

DB が起動していなくてもサーバーは起動する。接続状態は `/healthz/db` で確認する。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `make run` | サーバー起動 |
| `make migrate` | スキーマを DB に適用 |
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
| `JWT_SECRET` | （**必須**） | JWT の署名鍵（HS256）。未設定だとサーバーは起動しない |
| `JWT_EXPIRY_HOURS` | `24` | 発行するトークンの有効期間（時間） |
| `DB_HOST` | `127.0.0.1` | MySQL のホスト |
| `DB_PORT` | `3306` | MySQL のポート |
| `DB_USER` | `root` | 接続ユーザー |
| `DB_PASSWORD` | （空） | 接続パスワード |
| `DB_NAME` | `kurumo_api` | 接続先データベース |
| `DB_LOG_LEVEL` | `warn` | GORM のログ出力。`info` にすると発行 SQL がすべて出る |
| `DB_MAX_OPEN_CONNS` | `25` | 最大接続数 |
| `DB_MAX_IDLE_CONNS` | `5` | アイドル接続の保持数 |
| `DB_CONN_MAX_LIFETIME_SEC` | `300` | 接続の最大生存時間（秒） |

## 構成

```
backend/
├── cmd/
│   ├── server/          エントリポイント（起動・graceful shutdown）
│   └── migrate/         スキーマ適用（AutoMigrate）
└── internal/
    ├── config/          環境変数からの設定読み込み
    ├── auth/            パスワードのハッシュ化・照合、JWT の発行・検証
    ├── db/              GORM 接続の構築・疎通確認
    ├── model/           テーブルに対応する構造体
    ├── store/           DB への読み書き。GORM のエラーをここで変換する
    ├── handler/         HTTP ハンドラ・検証・JSON レスポンス補助
    └── server/          ルーティング・middleware（logging / recovery）
```

`handler` は GORM に依存しない。`store` が `gorm.ErrRecordNotFound` などを
`store.ErrNotFound` / `store.ErrEmailTaken` に変換し、`handler` はそれを
HTTP ステータスに対応付ける。

## マイグレーションについて

GORM の `AutoMigrate` を使い、`cmd/migrate` から実行する。サーバー起動時には
走らせていない。本番で意図しないスキーマ変更が起きるのを防ぐため。

**`AutoMigrate` はテーブルとカラムの「追加」しか行わない。** カラムの削除や
リネームは反映されないので、そうした変更が必要になった時点で goose などの
マイグレーションツールへ移行すること。

## テーブルを追加する

1. `internal/model/` に構造体を定義
2. `cmd/migrate/main.go` の `AutoMigrate` に追加
3. `internal/store/` に読み書きを実装
4. `internal/handler/` にハンドラを実装
5. `internal/server/server.go` にルートを登録

テストは `internal/handler/user_test.go` が雛形になる。インメモリ SQLite を
使うので、MySQL が起動していなくても実行できる。

エンドポイントを追加する場合は `internal/handler` にハンドラを作り、
`internal/server/server.go` の `New` でルートを登録する。
