---
name: figma-to-component
description: kurumo-web で Figma のデザインを frontend のコンポーネントに起こすときの手順。デザイン取得、tokens.css への変数反映、アセットの書き出しと配置、.tsx + .css ペアでの実装までを揃える。Figma の URL を渡された、デザインどおりに実装したい、tokens.css を更新したい、といった依頼で使う。
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

## 2. 変数を tokens.css に反映する

**実装より先にここをやる。** 部品の CSS に生の hex を書き始めると後から直しにくい。

- Figma で変数になっている値は、そのまま `tokens.css` の `:root` に足す
  （命名は `--color-primary-300`, `--radius-pill` のように Figma の階層に合わせる）
- **Figma で変数化されていないが実装に必要な値**は、その旨をコメントで併記してから足す
  ```css
  /* ロゴ内で使われる色。変数化されていないが実装上必要なので併記する */
  --color-logo-mark: #3dc0e9;
  ```
  黙って部品の CSS に直書きしない。後で Figma 側が変数化されたときに追えなくなる
- 既存の変数と値が食い違う場合、**コードを合わせるのではなく Figma 側とどちらが正しいか確認する**

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

`src/components/` に `Xxx.tsx` + `Xxx.css` の同名ペアで作る。named export。

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

Figma の値に小数が出てきても丸めない。**どこから来た数字かをコメントで残す。**

```tsx
{/* Figma 上のアイコン寸法は 23.531 x 24 */}
<img src={googleLogo} alt="" width={23.531} height={24} />
```

```css
/* 位置は Figma 基準。.auth-form の gap 19px に足りない分をマージンで補う */
.auth-link { margin-top: 5px; }
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

- [ ] 新しい色・寸法を tokens.css に足した（部品の CSS に直書きしていない）
- [ ] 変数化されていない値にはコメントで出どころを書いた
- [ ] アセットは `src/assets/brand/` に置いた
- [ ] `.tsx` + `.css` の同名ペア、named export
- [ ] 画面ごとに変わる寸法は props にした
- [ ] `alt` / `aria-label` / `htmlFor` を付けた
- [ ] `npm run lint && npm run build` が通る
