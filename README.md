## Classroom Library App (Next.js)

教室向けの書籍貸出 Web アプリです。Clerk による認証、Supabase Realtime による在庫更新、Prisma + PostgreSQL によるデータ永続化を採用しています。学生は書籍の閲覧・検索・貸出/返却ができ、管理者は書籍・在庫の管理を行えます。

## 主な機能

- 認証: Clerk でログイン/ログアウト、Webhook でユーザー作成時にアプリ内ユーザーを自動作成
- 書籍一覧: タイトル/著者検索、在庫バッジ表示、貸出状況のリアルタイム反映
- 貸出/返却: 教室内 IP のみ許可（フォーム送信後は /books にリダイレクト）
- 管理機能: 書籍の追加・削除(Withdraw)、在庫の追加・無効化(LOST)
- リアルタイム更新: Supabase Broadcast チャンネルで在庫ステータスを即時反映

## 技術スタック

- Next.js 15 / React 19（App Router）
- TypeScript / Tailwind CSS v4（PostCSS）
- Prisma / PostgreSQL（例: Supabase）
- Clerk（認証）/ Svix（Webhook 署名検証）
- Supabase Realtime（broadcast チャンネル）

## 必要要件

- Node.js 18+（推奨 20+）
- PostgreSQL 接続先（例: Supabase）
- Clerk プロジェクト（Publishable/Secret Key、Webhook Secret）

## 環境変数 (.env.local)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...               # プロジェクトURL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...   # クライアント公開キー
SUPABASE_SECRET_KEY=...                    # サーバ用シークレット

# DB 接続
DATABASE_URL=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# 教室IP 制御（カンマ区切り / プレフィックスは末尾にドット）
CLASSROOM_ALLOWED_IPS=""  # 例: "203.0.113.,198.51.100.42"

# Clerk Webhook
CLERK_WEBHOOK_SECRET=...
```

メモ:
- `CLASSROOM_ALLOWED_IPS` が空の場合は制限なし（開発用）。`203.0.113.` のように末尾 `.` を付けるとプレフィックス一致扱いになります。

## セットアップ

1) 依存関係のインストール

```
npm install
```

2) Prisma クライアント生成 + マイグレーション

```
npm run prisma:generate
npm run prisma:migrate
```

3) 開発サーバーの起動（Webpack 推奨）

```
npm run dev:webpack
```

4) アプリを開く → http://localhost:3000

初回ログイン時、Clerk の Webhook によりアプリ内ユーザー（User モデル）が作成されます。管理者（ADMIN）権限は DB で手動更新するか、管理用 UI を別途導入してください（現状は新規ユーザーは STUDENT です）。

## スクリーンショット


## アーキテクチャ

```mermaid
flowchart LR
  subgraph Browser
    UI[Books UI]
  end

  UI -- HTTP(S) --> Next[Next.js (App Router)]
  Next -- Prisma --> DB[(PostgreSQL)]
  Next -- Clerk SDK --> Clerk[Clerk]
  Clerk -- Svix Webhook --> Webhook[/api/webhooks/clerk]
  Next -- Supabase Client --> Realtime[(Supabase Realtime)]

  subgraph RealtimeBroadcast
    BR[library channel: loan:update]
  end

  Next <-. publishLoanEvent .-> BR
  BR -. push .-> UI
```

## ER 図（論理）

```mermaid
erDiagram
  USER ||--o{ LOAN : has
  BOOK ||--o{ COPY : has
  COPY ||--o{ LOAN : has

  USER {
    string id PK
    enum role "ADMIN|STUDENT"
  }
  BOOK {
    string id PK
    string isbn
    string title
    string author
    string publisher
    datetime publishedAt
    boolean isWithdrawn
  }
  COPY {
    string id PK
    string code UNIQUE
    enum status "AVAILABLE|LOANED|LOST|REPAIR"
    string bookId FK
  }
  LOAN {
    string id PK
    string copyId FK
    string userId FK
    datetime checkoutAt
    datetime returnedAt
  }
```

## 運用手順（Ops）

- 初期セットアップ
  - 環境変数を `.env.local`（本番は安全な手段で）に設定
  - `npm install && npm run prisma:generate && npm run prisma:migrate`

- 本番ビルド/起動
  - `npm run build:webpack` → `npm run start`
  - 逆プロキシの背後で動かす場合は `x-forwarded-for` / `x-real-ip` が渡るよう設定

- 管理者権限の付与
  - Prisma Studio: `npx prisma studio` で `User.role` を `ADMIN` に変更
  - もしくは SQL: `update "User" set role='ADMIN' where id='<clerk_user_id>';`

- データバックアップ/リストア（例: Supabase/PostgreSQL）
  - バックアップ: `pg_dump "$DATABASE_URL" > backup.sql`
  - リストア: `psql "$DATABASE_URL" < backup.sql`

- シークレットローテーション
  - Clerk の Publishable/Secret、Webhook Secret を更新→再デプロイ
  - Supabase の鍵を更新した場合も同様

- 監視/ログ
  - アプリログ: Next.js サーバープロセスの標準出力
  - Webhook 失敗時: Clerk ダッシュボードで確認

## 主要な画面

- `/books`: 書籍一覧（検索、在庫表示、管理タブ）
- `/borrow`: 貸出（教室 IP のみ）
- `/return`: 返却（教室 IP のみ）
- `/sign-in`: サインイン

管理タブは ADMIN のみ表示され、書籍の追加/削除（Withdraw）、在庫の追加/無効化が可能です。

## API 一覧（抜粋）

- POST `/api/loans/checkout`（教室 IP のみ）
  - フォーム: `copyId`
  - 成功時: `303` で `/books` にリダイレクト

- POST `/api/loans/return`（教室 IP のみ）
  - フォーム: `loanId`
  - 成功時: `303` で `/books` にリダイレクト

- POST `/api/books/create`（ADMIN）
  - JSON: `{ title, author?, isbn?, publisher?, publishedAt? }`
  - 初期在庫を 1 件自動作成します

- POST `/api/books/withdraw`（ADMIN）
  - JSON: `{ bookId }`
  - 書籍を一覧から非表示（履歴は保持）

- POST `/api/copies/create`（ADMIN）
  - JSON: `{ bookId, count?=1 }`（1〜20）
  - 指定冊数の在庫を追加

- POST `/api/copies/retire`（ADMIN）
  - JSON: `{ copyId }`
  - 未貸出の在庫を `LOST` に変更（在庫から除外）

- POST `/api/webhooks/clerk`（Clerk Webhook）
  - Svix 署名検証後、`user.created` イベントでアプリ内ユーザーを upsert

## ライセンス

MIT License

© 2025 Your Name. 本ソフトウェアは MIT ライセンスの下で提供されます。必要に応じて `LICENSE` ファイルを追加して正式な文面を配置してください。