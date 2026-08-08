# backend（Go）

Go 製の HTTP API サーバー。起動方法・エンドポイント一覧・環境変数は [README.md](README.md) にある。
ここには README に書いていない「実装するときの判断」を書く。

## 層とその責務

```
model  → テーブルに対応する構造体（GORM タグ）
store  → DB への読み書き。GORM のエラーをここで自前の error に変換する
handler→ HTTP の入出力。検証・ステータスコードの対応付け
server → ルーティングと middleware の組み立て
```

**`handler` は GORM に依存させない。** `store` が `gorm.ErrRecordNotFound` /
`gorm.ErrDuplicatedKey` を `store.ErrNotFound` / `store.ErrEmailTaken` に変換し、
`handler` の `writeStoreError` がそれを HTTP ステータスへ対応付ける。
新しい失敗の種類が必要になったら、この 2 箇所に足す。

`handler` に SQL や GORM の呼び出しを書きたくなったら、それは `store` の仕事。

## 依存を増やさない

ルーティングは `http.ServeMux` のメソッド付きパターン（`"GET /users/{id}"`）で足りている。
**web フレームワーク（gin, echo, chi など）やロガーライブラリを導入しない。**
ログは `log/slog`。他に依存が要ると判断した場合は追加前に相談すること。

DB アクセスは GORM。テストは `glebarez/sqlite`（cgo 不要の純 Go 実装）。

## レスポンスの書き方

ハンドラの中で `json.NewEncoder` を直接呼ばない。次の 3 つを使う。

| 関数 | 用途 |
| --- | --- |
| `JSON(w, status, body)` | 正常系 |
| `Error(w, status, msg)` | 単一メッセージのエラー |
| `ValidationError(w, fields)` | 検証エラー。400 と `fields` を返す |

エラーの形は `{"error": "...", "fields": {...}}` に統一されていて、
frontend の `ErrorBody` 型と対応している。**形を変えるときは frontend も直すこと。**

## エラーで内部情報を出さない

想定外のエラーは `internalError` を通す。詳細は `slog` でサーバーログにのみ残し、
クライアントには `internal server error` だけ返す。接続先や SQL が漏れるのを防ぐため。

DB に接続できなくてもサーバーは起動する。起動時に落とさず、状態は `/healthz/db` で見る。

## 入力の検証

- ボディの読み取りは `DisallowUnknownFields()` を有効にする。綴り間違いを黙って無視しないため。
- 文字列は `TrimSpace` してから検証する。
- 検証は「フィールド名 → 理由」の map を返す形（`validateUser` が雛形）。
  1 つ見つけた時点で打ち切らず、全フィールド分を返す。
- 長さ制限は `model` の `size:` タグと一致させる。日本語を数えるので
  文字数は `len([]rune(s))` を使う（`len(s)` はバイト数になる）。

## マイグレーション

GORM の `AutoMigrate` を `cmd/migrate` から実行する（`make migrate`）。
**サーバー起動時には走らせない。** 本番で意図しないスキーマ変更が起きるのを防ぐため。

`AutoMigrate` はテーブル・カラムの**追加しかしない**。カラムの削除やリネームが
必要になった時点で goose などへの移行を検討する。勝手に手で ALTER しない。

削除は論理削除（`gorm.DeletedAt`）。通常のクエリからは自動で除外される。
物理削除が必要な場合のみ `Unscoped()` を使う。

## テスト

- ハンドラのテストはインメモリ SQLite + `httptest`。MySQL が起動していなくても動く。
  `internal/handler/user_test.go` の `newTestHandler` が雛形。
- `gorm.Config` の `TranslateError: true` を外さないこと。これが無いと
  `gorm.ErrDuplicatedKey` に変換されず、重複エラーの判定が効かなくなる。
- 新しいエンドポイントを追加したらテストも追加する。

## コマンド

```sh
make run      # 起動（.env があれば読み込む）
make migrate  # スキーマ適用
make test     # go test ./...
make fmt      # go fmt ./...
make vet      # go vet ./...
```

変更後は `make fmt && make vet && make test` を通してから終える。
