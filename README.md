# SurveyPro — 測量現場支援システム

公共測量作業規程準拠の水準測量データ管理・計算・出力Webアプリケーション

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
- **DB**: Supabase (PostgreSQL) + Prisma ORM
- **認証**: NextAuth.js v5 (Google + メール/PW)
- **OCR**: Anthropic Claude API (サーバーサイドのみ)
- **エラー監視**: Sentry
- **デプロイ**: Vercel

## クイックスタート

```bash
git clone https://github.com/your-org/surveypro.git
cd surveypro
cp .env.example .env.local   # 環境変数を設定
npm install
npx prisma db push
npm run dev
```

## 必要な環境変数

`.env.example` を参照してください。最低限必要なもの:

| 変数名 | 生成方法 |
|--------|---------|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` |
| `DATABASE_URL` | Supabase Dashboard |
| `GOOGLE_CLIENT_ID/SECRET` | Google Cloud Console |
| `ANTHROPIC_API_KEY` | console.anthropic.com |

## セキュリティ

- `ANTHROPIC_API_KEY` はサーバーサイドのみで使用。クライアントには公開しない
- ユーザーのAPIキーはAES-256-GCMで暗号化してDBに保存
- `ENCRYPTION_KEY` は `.env.local` / Vercel環境変数で管理し、コードにハードコードしない

## 機能

### Phase 1（実装済み）
- 現場管理（6ヶ月自動削除・容量上限削除）
- 水準測量野帳（直接入力 + 写真OCR）
- 器械高式・昇降式自動計算
- 制限値判定 1〜4級（公共測量作業規程第34条）
- CSVエクスポート（現場・路線単位）
- 点の記データ管理
- チーム機能（オーナー/編集者/閲覧者）

### Phase 2（Coming Soon）
- トラバース計算・座標計算・面積計算・丁張計算

## Vercelデプロイ

```bash
npm i -g vercel
vercel link
vercel env pull .env.local   # 環境変数を同期
vercel --prod
```

## 準拠規程

公共測量作業規程（令和2年3月 国土交通省告示第367号）第32〜34条
