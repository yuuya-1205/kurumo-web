# frontend（React + TypeScript + Vite）

起動方法・環境変数・API 接続先は [README.md](README.md) にある。
ここには README に書いていない「実装するときの判断」を書く。

## Node のバージョン

**Node 22 が必要。作業前に `nvm use` すること。** Vite 8 が `>=20.19` を要求する。

満たしていないと `npm install` が `engine-strict` で失敗し、`npm run dev/build/preview` は
`scripts/check-node.mjs` が事前に止める。**これは想定どおりの挙動なので、
迂回するために `--force` を付けたり `.npmrc` や `engines` を緩めたりしない。**

## ディレクトリの使い分け

```
src/api/         backend との通信。fetch はここだけに書く
src/components/  画面をまたいで使う部品
src/pages/       画面単位のコンポーネント
src/styles/      デザイントークン（Tailwind の @theme）
```

- **コンポーネントの中で `fetch` を直接呼ばない。** `src/api/` に関数を置いて呼ぶ。
- **API 関数は失敗で例外を投げず、戻り値で表現する**（`probe` の `ProbeResult` が前例）。
  失敗も画面に出したいため。
- 1 画面でしか使わない部品は `src/pages/` 側に置いてよい。2 つ目の利用が出たら
  `src/components/` へ移す。

## コンポーネントの形

- 1 コンポーネント 1 ファイル（`.tsx` のみ）。**スタイルは Tailwind のクラスで書く。**
- **named export**（`export function Button`）。default export は使わない。
- props の型は `ComponentProps<'button'>` などを拡張して、余った props は
  `{...props}` で流す（`Button.tsx` が前例）。
- 呼び出し側から見た目を差し替えられるよう、`className` を受け取って末尾に連結する
  （`Button.tsx` が前例）。後から書いたクラスが勝つ。

## スタイル

**Tailwind CSS v4。** 設定ファイルは無く、テーマは `src/styles/tokens.css` の `@theme` にある。

**色・フォント・角丸は `@theme` のトークンをクラスとして使う。生の hex を書かない。**
必要な値が無い場合は `@theme` に足してから使う。

```
--color-primary-300  ->  bg-primary-300 / text-primary-300 / border-primary-300
--font-jp            ->  font-jp
--radius-pill        ->  rounded-pill
```

`@theme` は **Figma の変数を写したもの**で、Figma 側が正。値を変えるときは
Figma と揃っているか確認すること。勝手に色を調整しない。

注意点が 3 つある。

- **余白の基準は px。** `--spacing: 4px` を指定してあるので `p-4` = 16px。
  `:root` の font-size が 18px なので、既定の rem 基準のままだと Figma とずれる
- **`gray-*` は Figma のスケール**（200 / 400 / 900 の 3 段だけ）。
  Tailwind 既定の `gray-500` などは使わない
- **`border-none` と `border-t` を併用しない。** `border-style: none` が効いて線が消える。
  Preflight が `border-width: 0` を入れているので `border-none` はそもそも不要

複数箇所で使う長いクラス列は、モジュールスコープの定数に切り出して名前を付ける
（`AuthLayout.tsx` の `authFormClass`、`Button.tsx` の `base` が前例）。

Figma 由来の端数は任意値記法でそのまま入れる（`gap-[29.777px]`、`w-[27.96%]`）。
丸めない。**どこから来た数字かをコメントで残す。**

素の CSS を書くのは、ユーティリティで表現できないものだけ（`index.css` の `#root` など）。

## TypeScript / コードスタイル

Prettier などのフォーマッタは入っていない。**周囲のコードに合わせる**こと。

- セミコロンなし、シングルクォート、インデント 2 スペース
- 型は `type` で書く（`interface` は `vite-env.d.ts` の宣言マージ用途だけ）
- `any` を使わない。不明な値は `unknown` で受けて型ガードで絞る（`isErrorBody` が前例）
- 型のインポートは `import type` / `import { type X }`

lint は oxlint（`npm run lint`）。型チェックは `npm run build` の `tsc -b` が兼ねている。

## 環境変数

ブラウザから読むものは `VITE_` プレフィックスが必須。追加したら `.env.example` と
`src/vite-env.d.ts` の両方を更新する。`.env` はコミットしない。

## まだ無いもの

- **テストフレームワークは未導入。** 必要になったら相談してから入れる（勝手に vitest を追加しない）。
- 状態管理ライブラリは無い。`useState` と props で足りている。
- UI コンポーネントライブラリは無い。部品は `src/components/` に自前で置いている。

## コマンド

```sh
npm run dev     # dev サーバー（http://localhost:5173）
npm run build   # tsc -b と vite build
npm run lint    # oxlint
```

変更後は `npm run lint && npm run build` を通してから終える。
