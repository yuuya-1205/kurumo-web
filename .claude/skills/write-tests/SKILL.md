---
name: write-tests
description: kurumo-web でテストを書くときの方針と書き方。backend（Go）の handler テストを httptest とインメモリ SQLite で書く手順、テーブル駆動の形、失敗メッセージの書式、外部環境に依存するテストの逃がし方を揃える。「テストを書いて」「テストを追加」「テストが無い」といった依頼で使う。
---

# テストを書く

## 前提：どこにテストがあるか

- **backend** — `internal/handler/*_test.go` に 3 本。`go test ./...` で走る
- **frontend** — **テストフレームワークは未導入**（vitest も testing-library も入っていない）

**frontend にテストを書くよう頼まれたら、まず何を入れるかの判断が必要になる。**
勝手に vitest などを追加せず、相談すること。型チェックは `npm run build` の
`tsc -b`、lint は `npm run lint` が担っている。

以下は backend の話。

## 何をテストするか

**handler 層を通して HTTP の入出力として検証する。** `store` の単体テストは
今のところ置いておらず、handler 経由で間接的に確認している。この方針を変えたく
なったら相談すること。

テストを足すべきタイミング。

- エンドポイントを追加したとき（add-endpoint スキルの手順にも入っている）
- エラーの分岐を増やしたとき（新しいステータスコードを返すようになった）
- バグを直すとき。**先に再現するテストを書いてから直す**

逆に、getter や構造体の詰め替えなど、壊れようのないものにテストを書かない。

## ハンドラのテストの 2 つの形

### 依存が無いハンドラ — 直接呼ぶ

```go
req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
rec := httptest.NewRecorder()

Health().ServeHTTP(rec, req)
```

`health_test.go` が例。

### パスパラメータを使うハンドラ — ServeMux を通す

**`r.PathValue("id")` は `ServeMux` のパターンマッチを経由しないと空になる。**
ハンドラを直接呼ぶと id が取れず、原因の分かりにくい 400 になる。

`user_test.go` の `do` ヘルパーが、テスト用に `mux` を組み立ててから
`ServeHTTP` する形になっている。同じ形を使う。

```go
mux := http.NewServeMux()
mux.HandleFunc("GET /users/{id}", h.Get)
// ...
rec := httptest.NewRecorder()
mux.ServeHTTP(rec, r)
```

## DB を使うハンドラ

**インメモリ SQLite を使う。MySQL は起動していなくてよい。**
`go test ./...` が常に単体で通る状態を保つこと。

`user_test.go` の `newTestHandler` をそのまま使う。要点は 3 つ。

- `sqlite.Open(":memory:")` — テストごとに独立した DB になる
- **`TranslateError: true` を外さない。** これが無いと `gorm.ErrDuplicatedKey` に
  変換されず、重複エラー（409）の判定が効かなくなる
- `logger.Silent` — テスト出力に SQL を出さない

新しいテーブルを足したら `AutoMigrate` の引数にも追加する。

ヘルパー関数の先頭には **`t.Helper()`** を書く。失敗時の行番号が呼び出し側に出る。

## テーブル駆動

同じ形の入力を並べて確認する場合はテーブル駆動にする。`TestUser_Validation` が例。

```go
tests := []struct {
	name  string
	body  string
	field string
}{
	{"name が空", `{"name":"","email":"a@example.com"}`, "name"},
	{"email が空", `{"name":"田中","email":""}`, "email"},
}
```

- ケース名は**日本語で、何を確かめているかが分かる形**にする
- 分岐ごとに別のテスト関数にするより、1 つのテーブルにまとめた方が抜けに気づきやすい

一連の流れ（作成 → 取得 → 更新 → 削除 → 404）を確認する場合は、`TestUser_CRUD` の
ように 1 つの関数で順に進める。**削除後に 404 になることまで確認する。**

## 失敗メッセージ

**`got = X, want Y` の形で書く。** 何が起きたかだけでなく、何を期待していたかを出す。

```go
t.Fatalf("create status = %d, want %d (body: %s)", rec.Code, http.StatusCreated, rec.Body)
```

ステータスコードの検証では、**レスポンス body も一緒に出す**。検証エラーの中身が
分からないと原因を追えない。

`Fatalf` と `Errorf` を使い分ける。

| | 使う場面 |
| --- | --- |
| `t.Fatalf` | 続行できない（作成に失敗したら以降の取得も無意味） |
| `t.Errorf` | 独立した検証（name と email は両方確かめたい） |

## 外部環境に依存するテスト

環境によって前提が崩れるテストは、**失敗させずに `t.Skipf` で逃がす**。
理由をコメントに残すこと。

`dbhealth_test.go` は「到達できない DB に 503 を返す」ことを確かめるため、
何も listen していないポートを指定している。`gorm.Open` の時点で失敗する環境も
あるため、その場合は目的が達せられているものとして Skip する。

## 実行

```sh
cd backend && make test          # go test ./...
go test ./internal/handler/ -run TestUser_CRUD -v   # 1 本だけ
```

変更後は `make fmt && make vet && make test` を通してから終える。

## 最後の確認

- [ ] MySQL が起動していなくても `make test` が通る
- [ ] パスパラメータを使うハンドラは `ServeMux` を通している
- [ ] 失敗メッセージが `got = X, want Y` の形になっている
- [ ] ステータス検証で body も出している
- [ ] ヘルパーに `t.Helper()` を付けた
