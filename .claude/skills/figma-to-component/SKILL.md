---
name: figma-to-component
description: kurumo-web で Figma のデザインを frontend のコンポーネントに起こすときの手順。デザイン取得、tokens.css の @theme への変数反映、アセットの書き出しと配置、Tailwind での実装までを揃える。Figma の URL を渡された、デザインどおりに実装したい、tokens.css を更新したい、といった依頼で使う。
---

# Figma からコンポーネントを起こす

このリポジトリは **Figma が見た目の正**。`src/styles/tokens.css` の `@theme` は Figma の
変数を写したもので、コード側で勝手に値を決めない。

スタイルは **Tailwind CSS v4**。Figma MCP が返すコードも React + Tailwind なので、
クラスはそのまま活かせる部分が多い。ただしテーマのトークン名はこのリポジトリのものに置き換える。

`use_figma` 系のツールを使う場合は、先に `/figma-use` スキルを読むこと。

## 1. デザインを取得する

Figma MCP のツールで対象フレームを読む。

| ツール | 用途 |
| --- | --- |
| `get_design_context` | レイアウト・寸法・スタイルの構造 |
| `get_variable_defs` | 定義されている変数（色・数値） |
| `get_screenshot` | 見た目の確認。実装後の突き合わせにも使う |

**寸法の基準は 1280px 幅のフレーム。** `tokens.css` の `--auth-*` はこの基準で入っている。

## 2. 変数を tokens.css の @theme に反映する

**実装より先にここをやる。** クラスに生の hex（`bg-[#1fa2cb]`）を書き始めると後から直しにくい。

`@theme` に置いた値はそのままユーティリティになる。

```
--color-primary-300  ->  bg-primary-300 / text-primary-300 / border-primary-300
--font-jp            ->  font-jp
--radius-pill        ->  rounded-pill
```

- Figma で変数になっている値は、そのまま `@theme` に足す
  （命名は `--color-primary-300`, `--radius-pill` のように Figma の階層に合わせる）
- **Figma で変数化されていないが実装に必要な値**は、その旨をコメントで併記してから足す
  ```css
  /* ロゴ内で使われる色。変数化されていないが実装上必要なので併記する */
  --color-logo-mark: #3dc0e9;
  ```
  黙ってクラスに直書きしない。後で Figma 側が変数化されたときに追えなくなる
- 既存の変数と値が食い違う場合、**コードを合わせるのではなく Figma 側とどちらが正しいか確認する**
- 画面固有の寸法（`--auth-form-width` など）はユーティリティにする必要がないので
  `@theme` の外の `:root` に置き、`w-[var(--auth-form-width)]` で参照する

`index.css` にも変数があるが、こちらは疎通確認画面など Figma 由来でない部分のもの。
**混ぜない。** Figma のデザイントークンは `tokens.css` に置く。

## 3. アセットを書き出す

画像・アイコンは `src/assets/brand/` に置く。

- ロゴやアイコンは **SVG**、写真やグラデーションを含むものは PNG
- ファイル名はケバブケース（`logo-mark-light.svg`, `eye-off.svg`）
- 色違いは接尾辞で分ける（`logo-mark.svg` / `logo-mark-light.svg`）
- `.tsx` から `import mark from '../assets/brand/logo-mark.svg'` で読む

**Figma でレイヤーが分かれているものは分かれたまま書き出す。** ロゴはマークと文字が
別レイヤーなので、SVG 2 枚を重ねて `Logo` コンポーネントで再現している。

## 4. コンポーネントを実装する

`src/components/` に `Xxx.tsx` を作る。スタイルは Tailwind のクラスで書く。named export。

- **Figma のコンポーネント名と対応させ、JSDoc にその旨を書く**
  ```tsx
  /** 角丸ピル型のプライマリボタン。Figma の「対応ボタン」コンポーネント。 */
  ```
- **画面ごとに変わる寸法は props で受ける。** Figma 上でボタン幅が画面ごとに違うので、
  `Button` は `width` を px で取る形にしてある。CSS に固定値を焼き込まない
- バリアントは props で分ける（`Logo` の `variant?: 'color' | 'light'`）
- 素の HTML 要素をラップする場合は `ComponentProps<'button'>` を拡張し、
  余った props は `{...props}` で流す

### Figma の端数はそのまま入れる

Figma の値に小数が出てきても丸めない。任意値記法でそのまま入れ、
**どこから来た数字かをコメントで残す。**

```tsx
{/* Figma 上のアイコン寸法は 23.531 x 24 */}
<img src={googleLogo} alt="" width={23.531} height={24} />

{/* Figma 上の姓・名の間隔は 29.777px */}
<div className="flex w-full gap-[29.777px]">

{/* 位置は Figma 基準。form の gap 19px に足りない分をマージンで補う */}
<Link className="self-end mt-[5px] ...">
```

### 長いクラス列は定数にする

同じ組み合わせを複数箇所で使うなら、モジュールスコープの定数に切り出して名前を付ける。

```tsx
/** 認証画面のフォーム。要素間は Figma の 19px 間隔。 */
export const authFormClass = 'flex w-full flex-col items-center gap-[19px]'
```

### つまずきどころ

- **余白は px 基準**（`--spacing: 4px`）。`p-4` = 16px。`:root` の font-size が 18px なので
  rem 基準のままだと Figma とずれる
- **`border-none` と `border-t` を併用しない。** `border-style: none` が効いて線が消える。
  高さは 1px 残るので座標比較では気づけない — 必ず目視も行う
- **`gray-*` は Figma のスケール**（200 / 400 / 900）。Tailwind 既定の `gray-500` などは使わない

## 5. アクセシビリティ

デザインからは落ちるが、実装では必要になるもの。

- 装飾的な画像は `alt=""`。意味を持つ画像はラッパーに `role="img"` + `aria-label`（`Logo` が前例）
- アイコンだけのボタンには `aria-label` を付ける。状態が変わるなら `aria-pressed`
- 入力欄は `useId()` で id を作り `label` の `htmlFor` と結ぶ（`TextField` が前例）

## 6. 突き合わせ

```sh
cd frontend && npm run lint && npm run build && npm run dev
```

`get_screenshot` で取った Figma の画像と、ブラウザの表示を並べて確認する。
ずれていた場合、**まず tokens.css の値と Figma の変数が一致しているか**を疑う。

## 最後の確認

- [ ] 新しい色・寸法を tokens.css の `@theme` に足した（クラスに hex を直書きしていない）
- [ ] `@theme` と `:root` の使い分けが合っている（ユーティリティにするか、`var()` で参照するか）
- [ ] 変数化されていない値にはコメントで出どころを書いた
- [ ] アセットは `src/assets/brand/` に置いた
- [ ] named export、`className` を受け取れる形になっている
- [ ] 画面ごとに変わる寸法は props にした
- [ ] `alt` / `aria-label` / `htmlFor` を付けた
- [ ] 座標だけでなく**スクリーンショットでも**見た目を確認した
- [ ] `npm run lint && npm run build` が通る
