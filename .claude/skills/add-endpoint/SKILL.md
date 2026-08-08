---
name: add-endpoint
description: kurumo-web に API エンドポイントを追加・変更するときの手順。backend（Go）のハンドラ実装からルート登録、テスト、frontend の疎通確認画面への反映、ドキュメント更新までを漏れなく行う。「エンドポイントを追加」「API を生やす」「CRUD を作る」といった依頼で使う。
---

# エンドポイントの追加

このリポジトリはエンドポイントの情報が **backend の実装・frontend の一覧・README** の
3 箇所に分かれている。片方だけ直すと疎通確認画面から新しい API が見えないまま残るため、
以下を最後まで通すこと。

新しいテーブルが要るかどうかで分岐する。既存テーブルへの操作を足すだけなら手順 1 を飛ばす。

> **層構成について。** 手順 1〜4 は `model` / `store` / `handler` という**現状**の層を
> 前提にしている。目標は `domain` / `usecase` / `adapter` / `infrastructure` の 4 層で、
> そちらは [backend-clean-architecture スキル](../backend-clean-architecture/SKILL.md)
> にある。**新しく作る部分は 4 層で書く**（手順 5 以降のテスト・frontend への反映・
> ドキュメント更新はどちらでも同じ）。

## 1. モデルとマイグレーション（新しいテーブルが要る場合のみ）

1. `backend/internal/model/` に構造体を定義する。`internal/model/user.go` に倣う。
   - 論理削除するなら `DeletedAt gorm.DeletedAt` を持たせ、`json:"-"` で隠す
   - 文字列には `size:` を付ける。この値は後の検証の上限と一致させる
   - 一意にするカラムには `uniqueIndex`
2. `backend/cmd/migrate/main.go` の `AutoMigrate` に構造体を追加する。
3. `make migrate` で適用する（MySQL が起動している必要がある）。

## 2. store（DB アクセス）

`backend/internal/store/` に読み書きを実装する。`store/user.go` に倣う。

- メソッドは第 1 引数に `context.Context` を取り、`db.WithContext(ctx)` を通す
- **GORM のエラーをそのまま返さない。** `translate` で sentinel error に変換する
- 新しい失敗の種類（例: 参照されていて消せない）が要るなら、`store` に
  `ErrXxx` を定義してから `translate` に分岐を足す
- `Delete` は対象が無くてもエラーにならない。`RowsAffected == 0` で `ErrNotFound` を返す

## 3. handler（HTTP の入出力）

`backend/internal/handler/` にハンドラを実装する。`handler/user.go` に倣う。

- `store` を受け取る構造体 + `NewXxx` コンストラクタの形にする
- 入力の検証：
  - `json.NewDecoder` に `DisallowUnknownFields()` を付ける
  - 文字列は `TrimSpace` してから検証する
  - 検証エラーは「フィールド名 → 理由」の map にまとめ、`ValidationError` で返す
  - 文字数の上限は `len([]rune(s))` で数える（バイト数ではない）
- 正常系は `c.JSON(status, body)`（ボディを返さないときは `c.Status(http.StatusNoContent)`）。
  エラーは `Error` / `ValidationError` を通す。`json.NewEncoder` は直接呼ばない
- `store` のエラーは `writeStoreError` で HTTP ステータスへ対応付ける。
  想定外のエラーは `internalError` に通し、詳細はログにのみ残す
- **`handler` から GORM を import しない。** した時点で層の分け方が壊れている

## 4. ルート登録

`backend/internal/server/server.go` の `Route` に追加する。

```go
engine.GET("/users/:id", users.Get)
```

パスパラメータは `:id` 形式で書き、`c.Param("id")` で取って
`parseID` のように検証してから使う。

## 5. テスト

`backend/internal/handler/xxx_test.go` を追加する。`user_test.go` の
`newTestHandler` / `do` がそのまま使える（インメモリ SQLite なので MySQL 不要）。

最低限、次を確認する。

- 正常系のステータスコードとレスポンス body
- 検証エラー（400）が `fields` を返すこと
- 存在しない ID（404）

```sh
cd backend && make fmt && make vet && make test
```

## 6. frontend の疎通確認画面に反映

`frontend/src/api/health.ts` の `ENDPOINTS` に 1 件足す。**ここを忘れやすい。**

```ts
{
  id: 'users',
  method: 'GET',
  path: '/users',
  label: 'ユーザー一覧',
  description: '登録済みユーザーを返す',
}
```

- `id` は他と重複しない一意な文字列（結果の保持キーになる）
- `path` の先頭は `/`。`BASE_URL`（既定 `/api`）が前に付く
- レスポンスの型を frontend でも使うなら、`health.ts` に `type` を足す。
  backend の JSON タグ（スネークケース）と綴りを揃えること

`Endpoint` の `method` は現状 `'GET'` のみ。GET 以外を疎通確認に載せる場合は
`method` の型と `probe` のリクエスト生成（body の付与）を先に拡張する。

```sh
cd frontend && npm run lint && npm run build
```

## 7. ドキュメント

- `backend/README.md` のエンドポイント表に行を足す。エラーの条件が増えたなら
  エラーレスポンスの表も更新する
- 環境変数が増えたなら `backend/.env.example` と README の環境変数表の両方

## 最後の確認

- [ ] `make fmt && make vet && make test` が通る
- [ ] `npm run lint && npm run build` が通る
- [ ] `ENDPOINTS` に追加した
- [ ] `backend/README.md` のエンドポイント表を更新した
- [ ] `.env` をコミットに含めていない
