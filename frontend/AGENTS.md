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
src/styles/      デザイントークン（CSS 変数）
```

- **コンポーネントの中で `fetch` を直接呼ばない。** `src/api/` に関数を置いて呼ぶ。
- **API 関数は失敗で例外を投げず、戻り値で表現する**（`probe` の `ProbeResult` が前例）。
  失敗も画面に出したいため。
- 1 画面でしか使わない部品は `src/pages/` 側に置いてよい。2 つ目の利用が出たら
  `src/components/` へ移す。

## コンポーネントの形

- `Xxx.tsx` と `Xxx.css` を**同名で対にする**。`.tsx` の先頭で `import './Xxx.css'` する。
- **named export**（`export function Button`）。default export は使わない。
- props の型は `ComponentProps<'button'>` などを拡張して、余った props は
  `{...props}` で流す（`Button.tsx` が前例）。

## スタイル

**色・寸法・フォントは `src/styles/tokens.css` の CSS 変数を使う。新しく生の hex を書かない。**
必要な値が無い場合は tokens.css に変数を足してから使う。

`tokens.css` は **Figma の変数を写したもの**で、Figma 側が正。値を変えるときは
Figma と揃っているか確認すること。勝手に色を調整しない。

CSS Modules や CSS-in-JS は使っていない。クラス名はケバブケース（`.endpoint-head`）。

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

## コマンド

```sh
npm run dev     # dev サーバー（http://localhost:5173）
npm run build   # tsc -b と vite build
npm run lint    # oxlint
```

変更後は `npm run lint && npm run build` を通してから終える。
