# kurumo-web

frontend（React + TypeScript + Vite）と backend（Go）を 1 リポジトリに置いたモノレポ。
ルートにビルド設定は無い。作業は `frontend/` か `backend/` に入ってから行う。

詳細は各ディレクトリの `AGENTS.md` と `README.md` を見ること。ここには両方に関わることだけ書く。

## 2 つの間のつながり

- ブラウザ → Vite dev サーバー → Go サーバー、という経路。dev サーバーの proxy が
  `/api/*` を `http://localhost:8080` へ転送する（`frontend/vite.config.ts`）。
- ブラウザから見ると同一オリジンになるので、**backend に CORS の設定を入れる必要はない**。
  CORS エラーが出た場合、まず proxy を経由しているか（`VITE_API_BASE_URL` が
  backend の URL に直接向いていないか）を疑う。
- **エンドポイントの一覧が 2 箇所にある。** backend にエンドポイントを追加したら
  `frontend/src/api/health.ts` の `ENDPOINTS` にも足す。手順は
  [add-endpoint スキル](.claude/skills/add-endpoint/SKILL.md) に従う。

## スキル

更新漏れが起きやすい定型作業の手順と、迷いやすい設計判断を `.claude/skills/` に置いている。

| スキル | 使う場面 |
| --- | --- |
| [add-endpoint](.claude/skills/add-endpoint/SKILL.md) | API エンドポイントの追加・変更 |
| [add-page](.claude/skills/add-page/SKILL.md) | frontend に画面を追加する |
| [figma-to-component](.claude/skills/figma-to-component/SKILL.md) | Figma のデザインをコンポーネントに起こす |
| [component-design](.claude/skills/component-design/SKILL.md) | 部品の分け方・状態の置き場所・props を判断する |
| [write-tests](.claude/skills/write-tests/SKILL.md) | テストを書く |
| [backend-clean-architecture](.claude/skills/backend-clean-architecture/SKILL.md) | backend の層構成と依存の向き（**目標の形**） |
| [frontend-clean-architecture](.claude/skills/frontend-clean-architecture/SKILL.md) | frontend の層構成と依存の向き（**目標の形**） |

**アーキテクチャは両側ともクリーンアーキテクチャ**（domain / usecase / adapter /
infrastructure の 4 層 + 依存性逆転）を目標にしている。**現状のコードはまだその形に
なっていない。** 新しく書くコードはスキルの形に従い、既存コードは触るときに寄せる。

## 書き方の約束

- コミットメッセージ、コード内のコメント、ドキュメントは**日本語**で書く。
- コミットは `type: 日本語の要約` 形式（`feat:` / `fix:` / `chore:`）。
- 変更は PR にまとめてマージする。main に直接コミットしない。

## 触ってはいけないもの

- `.env` はコミットしない。設定項目を増やしたときは `.env.example` の方を更新する。
- `.claude/settings.local.json` はマシン固有。チームで共有したい設定は
  `.claude/settings.json` に置く。
- `frontend/dist/` はビルド生成物。手で編集しない。

## 変更後の確認

片方だけ触った場合はそちらだけでよい。

```sh
cd backend  && make fmt && make vet && make test
cd frontend && npm run lint && npm run build
```
