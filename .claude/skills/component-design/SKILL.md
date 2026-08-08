---
name: component-design
description: kurumo-web の frontend でコンポーネントの分け方・状態の置き場所・props の設計を判断するときの指針。部品を切り出すべきか、状態をどこに持たせるか、props をどう受けるか迷ったときに使う。「この画面をどう分割するか」「共通化すべきか」「state をどこに置くか」といった設計判断で参照する。
---

# コンポーネント設計の判断

手順ではなく**判断基準**。画面を足す手順は add-page スキル、Figma からの実装は
figma-to-component スキルにある。

前提として、このリポジトリには**状態管理ライブラリもフォームライブラリも無い**。
`useState` と props で足りている。足りなくなったと感じたら、入れる前に相談すること。

## 1. 部品をどこに置くか

置き場所は 3 つあり、**迷ったら一番狭いところから始める**。

| 使われ方 | 置き場所 |
| --- | --- |
| 1 画面の中だけ | **同じ `.tsx` ファイル内に関数として定義**。別ファイルにもしない |
| 2 画面以上 | `src/components/` に切り出す |
| 画面そのもの | `src/pages/` |

`HealthCheckPage.tsx` の `ResultView` が 1 番目の例。ページと同じファイルの下に
置いてあり、`export` もしていない。

**切り出しは 2 つ目の利用が出てから。** 「将来使うかも」で `src/components/` に
置かない。1 ファイル内に閉じている部品は移動が簡単だが、共通部品にしてしまうと
剥がすのが難しくなる。

## 2. 状態をどこに置くか

**原則：その状態を使う一番狭い範囲に置く。**

- **部品の中で完結する状態は部品が持つ。**
  `PasswordField` の表示切り替え（`visible`）は、外から制御する必要がないので
  部品の内部にある。呼び出し側は何も渡さない
- **複数の子で共有する状態はページが持つ。**
  `HealthCheckPage` は `results` と `pending` をページに持ち、`ResultView` へは
  props で渡すだけ。`ResultView` 自身は状態を持たない
- **表示用の派生値は state にしない。** 計算で出せるものは毎回計算する
  ```tsx
  const busy = Object.values(pending).some(Boolean)  // useState にしない
  ```

状態を持ち上げるのは、**2 つ目の利用者が出てから**でよい。先に持ち上げない。

## 3. 入力欄は非制御が既定

認証画面の入力欄は `value` / `onChange` を持っていない。`name` と `autoComplete` を
付けてブラウザに任せ、送信時にまとめて読む。

**制御（`value` + `onChange`）にするのは、入力に応じて他の表示が変わるときだけ。**
文字数カウンタ、リアルタイム検証、他の欄の出し分けなど。理由なく制御にしない。

ラベルと入力欄は `useId()` で結ぶ。id を props で受け取らない（`TextField` は
`Omit<ComponentProps<'input'>, 'id'>` で明示的に塞いでいる）。

## 4. props の設計

### 素の HTML 要素をラップするとき

`ComponentProps<'button'>` などを拡張し、**余った props は `{...props}` で流す**。
使う属性を 1 つずつ列挙しない。

```tsx
type ButtonProps = ComponentProps<'button'> & { width?: number }
```

内部で固定したい属性は `Omit` で塞ぐ（`TextField` の `'id'`）。

### バリアントは union、boolean を増やさない

```tsx
variant?: 'color' | 'light'   // ○ Logo の書き方
isLight?: boolean             // ✗ 3 つ目が出た時に破綻する
```

**boolean の props が 3 つ以上になったら、union か別コンポーネントへの分割の合図。**

### 画面ごとに変わる寸法は props で受ける

Figma 上でボタン幅やフォーム幅が画面ごとに違うため、`Button` は `width`、
`AuthLayout` は `width` を px で取り `style` に渡す。**クラスに固定値を焼き込まない。**

```tsx
<Button type="submit" width={284}>アカウントを作成</Button>
<AuthLayout width={660} lead="入力した情報は予約時などに利用されます。">
```

### 差し込みは children と名前付き props を使い分ける

- 中身がまるごと入れ替わる → `children`
- **位置が決まっている差し込み** → 名前付き props（`AuthLayout` の `lead`）

差し込む props の型は `ReactNode`。文字列に限定しない（リンクを含めたくなる）。

## 5. 1 ファイルに複数の部品を置いてよい場合

`TextField.tsx` は `TextField` と `PasswordField` を両方 export している。
**クラス定数（`fieldClass` / `inputClass`）とファイル内の `Label` を共有していて、
片方を直すともう片方も直すことになる**ため。

逆に、関係のない部品を 1 ファイルにまとめない。判断は「片方の変更がもう片方に
波及するか」。

## 6. クラスをどう持つか

スタイルは Tailwind のユーティリティで当てる。**部品ごとの `.css` は無い。**
問題は「クラス列をどこに置くか」で、判断は部品の置き場所と同じく**一番狭いところから**。

| 使われ方 | 置き方 |
| --- | --- |
| その要素だけ | JSX に直接書く |
| 部品の中で使い回す / 長い | **モジュールスコープの `const`** に名前を付ける |
| 画面側からも使う | レイアウト部品から **`export`** する |

`Button.tsx` の `base`、`TextField.tsx` の `inputClass` が 2 番目。
`AuthLayout.tsx` の `authFormClass` / `authMessageClass` が 3 番目。

**JSX に長いクラス列を直接並べない。** 定数に切り出すと名前で意図が説明でき、
Figma のどこから来た値かをコメントで残せる。

```tsx
/* 枠線込みで 56px に収めるため、上下の padding は 16px ではなく 15px */
const inputClass = 'box-border w-full px-4 py-[15px] border border-gray-400 rounded-field'
```

**呼び出し側の `className` は末尾に連結して後勝ちにする。** 部品の既定を
上書きできるようにするため。

```tsx
className={className ? `${base} ${className}` : base}
```

値は `@theme` のトークンをクラスとして使う。生の hex を書かない。
詳細は add-page / figma-to-component スキルにある。

## 7. やりすぎの兆候

次が出たら、抽象化を戻すか分割することを考える。

- props が増え続けている → 用途が 2 つ以上混ざっている
- boolean の props が 3 つ以上ある
- 呼び出し側が毎回同じ props の組み合わせを渡している → その組み合わせが本当の部品
- 1 箇所でしか使われていないのに `src/components/` にある

**共通化しすぎた部品を戻すコストの方が、重複を放置するコストより高い。**
2 箇所の重複は許容してよい。
