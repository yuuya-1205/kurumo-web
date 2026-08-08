---
name: backend-clean-architecture
description: kurumo-web の backend（Go）をクリーンアーキテクチャで実装するときの層構成と依存の向き。domain / usecase / adapter / infrastructure の 4 層、依存性逆転、エンティティと DB モデルの分離、層ごとのテストの書き方を定める。新しい機能を追加するとき、既存コードを層に寄せるとき、「どの層に書くべきか」で迷ったときに使う。
---

# backend のクリーンアーキテクチャ

**これは目標の形であり、現状のコードはまだこの形になっていない。**
`internal/model` / `internal/store` / `internal/handler` の 3 層で、usecase 層が無く、
handler が store の具象型を持っている。移行の進め方は最後の節にある。

**新しく書くコードはこの形に従う。** 既存コードは触るときに寄せる。

## 層と依存の向き

```
infrastructure  →  adapter  →  usecase  →  domain
                                              ↑
                        （最内側。何にも依存しない）
```

**import は内側にしか向かない。** 外側の名前が内側に出てきたら、その時点で誤り。

```
internal/
├── domain/          エンティティ・ドメインのエラー・リポジトリの interface
├── usecase/         アプリケーション固有のルール。domain だけに依存
├── adapter/
│   ├── handler/     HTTP ↔ usecase の変換。gin を知るのはここまで
│   └── persistence/ リポジトリの GORM 実装と DB モデル
└── infrastructure/
    ├── config/      環境変数
    ├── db/          GORM 接続
    └── server/      engine の組み立て・middleware・ルート登録
```

DI の組み立ては `cmd/server/main.go`（composition root）で行う。

## domain — 最内側

**標準ライブラリ以外を import しない。** `gorm`, `gin`, `net/http`, `encoding/json` は
すべて禁止。JSON も HTTP も DB も、ドメインの関心ではない。

置くもの。

| ファイル | 内容 |
| --- | --- |
| `user.go` | `User` エンティティと不変条件（検証） |
| `errors.go` | `ErrNotFound`, `ErrEmailTaken`, `ValidationError` |
| `user_repository.go` | `UserRepository` interface |

**エンティティは GORM タグを持たない。**

```go
package domain

type User struct {
	ID        uint64
	Name      string
	Email     string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Validate は不変条件を確かめる。フィールド名 → 理由 を返す。
func (u User) Validate() map[string]string { ... }
```

**リポジトリの interface は domain に置く。** これが依存性逆転の核心で、
内側が「何を必要とするか」を宣言し、外側がそれを満たす。

```go
package domain

type UserRepository interface {
	List(ctx context.Context) ([]User, error)
	Get(ctx context.Context, id uint64) (*User, error)
	Create(ctx context.Context, u *User) error
	Update(ctx context.Context, u *User) error
	Delete(ctx context.Context, id uint64) error
}
```

**検証をどこに書くかの判断**。「業務上ありえない」なら domain、「HTTP の形式が不正」なら handler。

| 例 | 置き場所 |
| --- | --- |
| 名前が空、メールアドレスの形式、文字数上限 | domain |
| JSON がパースできない、未知のフィールド、`id` が数値でない | handler |

## usecase — アプリケーション固有のルール

**domain だけを import する。** gin も GORM も知らない。

- リポジトリは**コンストラクタで受け取る**。中で具象型を生成しない
- 受け取るのは `domain.UserRepository`（interface）であって、具象の GORM 実装ではない
- `gin.Context` を引数に取らない。`context.Context` だけ

```go
package usecase

type User struct {
	repo domain.UserRepository
}

func NewUser(r domain.UserRepository) *User { return &User{repo: r} }

func (u *User) Create(ctx context.Context, name, email string) (*domain.User, error) {
	user := &domain.User{Name: name, Email: email}
	if fields := user.Validate(); len(fields) > 0 {
		return nil, domain.NewValidationError(fields)
	}
	return user, u.repo.Create(ctx, user)
}
```

「複数のリポジトリをまたぐ」「順序が決まっている」といった**手続き**を書く層。
1 リポジトリを素通しするだけでも層は省略しない。後から手続きが増えるため。

## adapter/handler — HTTP との境界

**HTTP ステータスコードを知るのはこの層だけ。** domain のエラーを HTTP に対応付ける。

- **usecase の interface に依存する。** interface は**使う側（handler）に定義する**
  ```go
  package handler

  type UserUsecase interface {
      Create(ctx context.Context, name, email string) (*domain.User, error)
      // 必要なメソッドだけ書く
  }
  ```
  テストで fake に差し替えられるようにするため。usecase の具象型を直接持たない
- レスポンスは domain のエンティティをそのまま返さず、**この層の DTO に詰め替える**。
  エンティティの変更が API の形に直結しないようにする
- `gin.Context` から先へ進ませない。`c` を usecase に渡さない

エラーの対応付けは 1 箇所にまとめる。

| domain のエラー | HTTP |
| --- | --- |
| `ErrNotFound` | 404 |
| `ErrEmailTaken` | 409 |
| `ValidationError` | 400（`fields` 付き） |
| それ以外 | 500（詳細は slog にのみ） |

## adapter/persistence — DB との境界

`domain.UserRepository` を実装する。**GORM を知るのはこの層だけ。**

**DB モデルとエンティティを分ける。**

```go
package persistence

// userRecord は users テーブルに対応する。GORM のタグはここにだけ書く。
type userRecord struct {
	ID        uint64         `gorm:"primaryKey"`
	Name      string         `gorm:"size:100;not null"`
	Email     string         `gorm:"size:255;not null;uniqueIndex"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (r userRecord) toDomain() domain.User { ... }
func fromDomain(u domain.User) userRecord  { ... }
```

- `gorm.ErrRecordNotFound` / `gorm.ErrDuplicatedKey` は**この層で domain のエラーに変換する**。
  GORM のエラーを外に漏らさない
- `AutoMigrate` に渡すのは `userRecord`（`cmd/migrate`）

## infrastructure

`config` / `db` / `server` を置く。**フレームワークと外部サービスの都合はここに閉じる。**

`server` は gin engine を組み立て、middleware を挿し、ルートを登録するだけ。
**ここで `NewUser(...)` の連鎖を書かない**（それは composition root の仕事）。

## DI は composition root で

`cmd/server/main.go` が唯一、全ての層の具象型を知る場所。

```go
repo := persistence.NewUserRepository(gdb)   // adapter が domain の interface を満たす
uc := usecase.NewUser(repo)                  // usecase は interface だけを見る
h := handler.NewUser(uc)                     // handler は自前の interface だけを見る
srv := server.New(cfg, h)
```

**他の場所で具象型を new しない。** 生成が散ると差し替えられなくなる。

## テスト

層ごとに、その内側だけを本物にする。

| 対象 | 差し替えるもの |
| --- | --- |
| `usecase` | fake の `domain.UserRepository`（メモリ上の map で十分） |
| `adapter/handler` | fake の `UserUsecase` |
| `adapter/persistence` | インメモリ SQLite（`glebarez/sqlite`） |
| `domain` | 何も要らない。純粋な関数として直接呼ぶ |

**usecase のテストで DB を使わない。** DB が要るなら、それは層の分け方を間違えている。
書き方の詳細は write-tests スキルにある。

## やってはいけない

- `domain` が `gorm` / `gin` / `encoding/json` を import する
- `usecase` が `gin.Context` を受け取る、SQL を書く
- `handler` が `domain.User` をそのままレスポンスにする（DTO を挟む）
- `handler` が GORM のエラーを見る
- リポジトリの interface を `adapter` 側に定義する（依存の向きが逆になる）
- `server` や `handler` の中で具象型を new する

## 既存コードからの移行

現状との対応。**1 エンドポイントずつ移す。** 全部を一度に動かさない。

| 現状 | 移行先 |
| --- | --- |
| `internal/model/user.go` | `domain/user.go`（GORM タグを剥がす）+ `adapter/persistence` の `userRecord` |
| `internal/store/user.go` | `adapter/persistence/user.go`（`domain.UserRepository` を実装） |
| `internal/handler/user.go` | `adapter/handler/user.go` + 検証を `domain` へ、手続きを `usecase` へ |
| `internal/server/` | `infrastructure/server/`。DI は `cmd/server/main.go` へ |
| `internal/config`, `internal/db` | `infrastructure/` 配下へ移動（中身は変えない） |

移行の順序。

1. `domain` を作り、エンティティと interface とエラーを置く
2. `adapter/persistence` を作り、既存の `store` を移して interface を満たさせる
3. `usecase` を作り、`handler` にあった手続きと検証を移す
4. `handler` を `adapter/handler` へ移し、usecase の interface に差し替える
5. DI を `cmd/server/main.go` に集約する
6. 各段階で `make fmt && make vet && make test` を通す

**移行の途中でエンドポイントを壊さない。** 既存のテストが通ることを各段階で確認する。
