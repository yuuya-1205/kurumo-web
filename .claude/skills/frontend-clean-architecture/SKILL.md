---
name: frontend-clean-architecture
description: kurumo-web の frontend（React + TypeScript）をクリーンアーキテクチャで実装するときの層構成と依存の向き。domain / usecase / adapter(api) / ui の 4 層、依存性逆転、backend の JSON とドメイン型の変換、失敗の扱いを定める。API 連携を実装するとき、画面からデータを扱うとき、「どの層に書くべきか」で迷ったときに使う。
---

# frontend のクリーンアーキテクチャ

**これは目標の形であり、現状のコードはまだこの形になっていない。**
`pages` / `components` / `api` だけで、domain も usecase も無い。移行は最後の節にある。

**新しく書くコードはこの形に従う。** 既存コードは触るときに寄せる。

## 層と依存の向き

backend と同じ 4 層に対応させる。**import は内側にしか向かない。**

```
ui  →  adapter  →  usecase  →  domain
                                  ↑
                （最内側。React も fetch も知らない）
```

```
src/
├── domain/      型・ドメインのエラー・リポジトリの interface
├── usecase/     アプリ操作。domain だけに依存
├── api/         リポジトリの fetch 実装（＝ adapter 層）
├── components/  ui 層
├── pages/       ui 層
└── main.tsx     composition root（DI の組み立て）
```

**ディレクトリは `ui/` にまとめず、既存の `components/` `pages/` をそのまま ui 層として扱う。**
`api/` が adapter 層。層の境界は守るが、移動によるコストは払わない。

## domain — 最内側

**import 文をゼロにする。** React も `react-router` も `fetch` も他の層も参照しない。
型と純関数だけ。

```ts
// domain/user.ts
export type User = {
  id: number
  name: string
  email: string
}

/** 不変条件。フィールド名 → 理由 を返す。 */
export function validateUser(input: { name: string; email: string }): Record<string, string> {
  ...
}
```

**リポジトリの interface は domain に置く。** 内側が「何を必要とするか」を宣言する。

```ts
// domain/userRepository.ts
export type UserRepository = {
  list(): Promise<Result<User[], DomainError>>
  create(input: { name: string; email: string }): Promise<Result<User, DomainError>>
}
```

### 失敗は例外ではなく戻り値で表す

既存の `probe` が `ProbeResult` で失敗を返しているのと同じ考え方を全体に広げる。
**画面に出したい失敗を例外にしない。**

```ts
// domain/result.ts
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
```

ドメインのエラーは種類で分ける。**HTTP ステータスを domain に持ち込まない。**

```ts
// domain/errors.ts
export type DomainError =
  | { type: 'notFound' }
  | { type: 'emailTaken' }
  | { type: 'validation'; fields: Record<string, string> }
  | { type: 'unavailable'; message: string }   // 通信断・サーバー障害
```

## usecase — アプリ操作

**domain だけを import する。** `fetch` を呼ばない。React を知らない。

**リポジトリは引数で受け取る。** モジュールの中で実装を import しない。

```ts
// usecase/signUpUser.ts
export async function signUpUser(
  repo: UserRepository,
  input: { name: string; email: string },
): Promise<Result<User, DomainError>> {
  const fields = validateUser(input)
  if (Object.keys(fields).length > 0) {
    return { ok: false, error: { type: 'validation', fields } }
  }
  return repo.create(input)
}
```

送信前の検証、複数の呼び出しの順序、結果の組み立てはここに書く。
**1 リポジトリを素通しするだけでも層は省略しない。**

## api — adapter 層

`domain` の interface を実装する。**`fetch` を知るのはこの層だけ。**

ここが引き受ける変換は 3 つ。

1. **命名の変換** — backend の JSON は `created_at` のようなスネークケース。
   domain 型はキャメルケース。**この境界で必ず変換する**
2. **エラーの変換** — HTTP ステータスと backend の `{"error":..., "fields":...}` を
   `DomainError` に対応付ける。**ステータスコードを外へ漏らさない**
3. **通信の失敗** — サーバーに届かなかった場合も `unavailable` として戻り値で返す

| HTTP | DomainError |
| --- | --- |
| 404 | `notFound` |
| 409 | `emailTaken` |
| 400 + `fields` | `validation` |
| その他 / 接続断 | `unavailable` |

接続先の決め方（`VITE_API_BASE_URL`、既定は dev proxy 経由の `/api`）もこの層の関心。

## ui — components / pages

- **`fetch` を直接書かない。`api/` を直接 import しない。**
  usecase を呼ぶ。リポジトリは composition root から受け取る
- 受け取った `DomainError` を**表示用の日本語に変換するのは ui の仕事**。
  文言を domain や api に置かない
- `validation` の `fields` は入力欄ごとの表示に対応させる（backend の `fields` と同じ形）

```tsx
const result = await signUpUser(repo, { name, email })
if (!result.ok) {
  setErrors(messagesOf(result.error))   // 表示文言への変換は ui
  return
}
navigate('/signup/done')
```

コンポーネントの分け方・状態の置き場所は component-design スキルにある。

## DI は composition root で

`main.tsx` が唯一、具象の実装を知る場所。React Context で配る。

```tsx
// main.tsx
const repo = createUserRepository()   // api 層の実装

createRoot(...).render(
  <RepositoryProvider value={{ user: repo }}>
    <App />
  </RepositoryProvider>,
)
```

**画面の中で実装を import しない。** テストや Storybook で差し替えられなくなる。

## やってはいけない

- `domain/` に `import` がある（React・fetch・他の層のいずれも）
- `usecase/` が `fetch` を呼ぶ、`api/` の実装を import する
- `pages/` が `api/` を直接 import する
- HTTP ステータスコードが `api/` の外に出る
- 表示用の日本語が `domain/` や `api/` にある
- スネークケースのキーが `usecase/` や `ui/` に出てくる

## 既存コードからの移行

現状との対応。**1 機能ずつ移す。**

| 現状 | 移行先 |
| --- | --- |
| `api/auth.ts` `api/health.ts` の型定義 | `domain/` へ（キャメルケースに直す） |
| `api/auth.ts` の `ApiResult`、`api/health.ts` の `ProbeResult` | `domain/result.ts` の `Result` に一本化 |
| `api/auth.ts` `api/health.ts` の呼び出し関数 | `api/` に残す（adapter 実装として interface を満たさせる） |
| `api/token.ts` | `api/` に残す。トークンの置き場所は adapter の関心 |
| 画面の中の遷移・検証 | `usecase/` へ |
| `components/` `pages/` | 移動しない。ui 層として扱う |

移行の順序。

1. `domain/` に `Result`、`DomainError`、型を置く
2. `domain/` にリポジトリの interface を置く
3. `api/` の既存関数を interface を満たす形に整える
4. `usecase/` を作り、画面にある検証と手続きを移す
5. `main.tsx` に composition root を作り、Context で配る
6. 各段階で `npm run lint && npm run build` を通す

### 最初に手を付けるとよいところ

認証は `api/auth.ts` 経由で backend につながっている。目標の形との差が既に出ているので、
ここが移行の入口になる。

- **`api/auth.ts` の `User` 型が `created_at` / `updated_at` のままスネークケース。**
  backend の JSON をそのまま型にしており、これが ui まで漏れている。
  domain 型（キャメルケース）と、api 層での変換を入れる
- **`ApiResult` が `status`（HTTP ステータス）を持ったまま外に出ている。**
  `DomainError` に変換して、ステータスを api 層に閉じる
- **`BASE_URL` が `auth.ts` と `health.ts` に重複している**（コードのコメントにも
  その旨がある）。adapter 層を整理するときに 1 箇所へ寄せる
