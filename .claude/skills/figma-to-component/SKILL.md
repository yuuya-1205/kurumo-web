---
name: figma-to-component
description: kurumo-web で Figma のデザインを frontend のコンポーネントに起こすときの手順。デザイン取得、tokens.css の @theme へのトークン反映、アセットの書き出しと配置、Tailwind クラスでの実装までを揃える。Figma の URL を渡された、デザインどおりに実装したい、tokens.css を更新したい、といった依頼で使う。
---

# Figma からコンポーネントを起こす

このリポジトリは **Figma が見た目の正**。`src/styles/tokens.css` は Figma の変数を
写したもので、コード側で勝手に値を決めない。

`use_figma` 系のツールを使う場合は、先に `/figma-use` スキルを読むこと。

## 1. デザインを取得する

Figma MCP のツールで対象フレームを読む。

| ツール | 用途 |
| --- | --- |
| `get_design_context` | レイアウト・寸法・スタイルの構造 |
| `get_variable_defs` | 定義されている変数（色・数値） |
| `get_screenshot` | 見た目の確認。実装後の突き合わせにも使う |

**寸法の基準は 1280px 幅のフレーム。** `tokens.css` の `--auth-*` はこの基準で入っている。

## 2. トークンを tokens.css に反映する

**実装より先にここをやる。** クラスに生の hex を書き始めると後から直しにくい。

`tokens.css` には置き場所が 2 つある。**使い分けを間違えない。**

| 置き場所 | 入れるもの | 参照の仕方 |
| --- | --- | --- |
| `@theme { }` | ユーティリティにしたい値（色・フォント・角丸・影） | `bg-primary-300`, `font-jp`, `rounded-pill` |
| `:root { }` | 参照できれば足りる値（画面固有の寸法） | `h-[var(--auth-control-height)]` |

- Figma で変数になっている色・フォント・角丸は `@theme` に足す。
  命名は `--color-primary-300`, `--radius-pill` のように Figma の階層に合わせる
- **Figma で変数化されていないが実装に必要な値**は、出どころをコメントで併記してから足す
  ```css
  --color-logo-mark: #3dc0e9; /* ロゴのマーク */
  ```
  黙ってクラスに直書きしない。後で Figma 側が変数化されたときに追えなくなる
- 既存の値と食い違う場合、**コードを合わせるのではなく Figma 側とどちらが正しいか確認する**
- **`gray` は Figma のスケール（200 / 400 / 900）だけ。** Tailwind 既定の `gray-500` などは使わない
- 余白は `--spacing: 4px` が指定済みなので、`p-4` = 16px と Figma の px から素直に決まる

`index.css` にも CSS 変数があるが、こちらは Figma 由来でない部分（疎通確認画面の配色）。
**`@theme` に混ぜない。** クラス側からは `text-[var(--text)]` のように参照する。

## 3. アセットを書き出す

画像・アイコンは `src/assets/brand/` に置く。

- ロゴやアイコンは **SVG**、写真やグラデーションを含むものは PNG
- ファイル名はケバブケース（`logo-mark-light.svg`, `eye-off.svg`）
- 色違いは接尾辞で分ける（`logo-mark.svg` / `logo-mark-light.svg`）
- `.tsx` から `import mark from '../assets/brand/logo-mark.svg'` で読む

**Figma でレイヤーが分かれているものは分かれたまま書き出す。** ロゴはマークと文字が
別レイヤーなので、SVG 2 枚を重ねて `Logo` コンポーネントで再現している。

## 4. コンポーネントを実装する

`src/components/` に `.tsx` 1 ファイルで作る。**部品ごとの `.css` は作らない。**
named export。

- **Figma のコンポーネント名と対応させ、JSDoc にその旨を書く**
  ```tsx
  /** 角丸ピル型のプライマリボタン。Figma の「対応ボタン」コンポーネント。 */
  ```
- **画面ごとに変わる寸法は props で受ける。** Figma 上でボタン幅が画面ごとに違うので、
  `Button` は `width` を px で取り `style` に渡している。クラスに固定値を焼き込まない
- バリアントは props で分ける（`Logo` の `variant?: 'color' | 'light'`）
- 素の HTML 要素をラップする場合は `ComponentProps<'button'>` を拡張し、
  余った props は `{...props}` で流す。`className` は末尾に連結して後勝ちにする

### クラスは定数に括り出す

**長いクラス列を JSX に直接並べない。** モジュールスコープの定数に名前を付け、
Figma のどこから来た値かをコメントで残す。

```tsx
/* 枠線込みで 56px に収めるため、上下の padding は 16px ではなく 15px */
const inputClass =
  'box-border w-full min-h-[var(--auth-control-height)] px-4 py-[15px] ' +
  'border border-gray-400 rounded-field bg-back'
```

画面側からも使うものは、レイアウト部品から export する
（`AuthLayout.tsx` の `authFormClass` / `authMessageClass`）。

### Figma の端数はそのまま入れる

Figma の値に小数が出てきても丸めない。任意値記法でそのまま書く。

```tsx
{/* Figma 上のアイコン寸法は 23.531 x 24 */}
<img src={googleLogo} alt="" width={23.531} height={24} />
```

```tsx
{/* Figma 上の姓・名の間隔は 29.777px */}
<div className="flex w-full gap-[29.777px]">
```

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

- [ ] 新しい色・フォント・角丸は `@theme` に足した（クラスに生の hex を書いていない）
- [ ] `@theme` と `:root` の使い分けが合っている
- [ ] 変数化されていない値にはコメントで出どころを書いた
- [ ] アセットは `src/assets/brand/` に置いた
- [ ] `.tsx` 1 ファイル、named export。長いクラス列は定数に括り出した
- [ ] 画面ごとに変わる寸法は props にした
- [ ] `alt` / `aria-label` / `htmlFor` を付けた
- [ ] `npm run lint && npm run build` が通る
