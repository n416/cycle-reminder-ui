# Cycle Reminder UI

React + TypeScript + Vite で構築されたフロントエンドアプリケーションです。

## 概要

本プロジェクトは、サーバー、チャンネル、リマインダー等の管理機能を備えたWebアプリケーションのUI（フロントエンド）部分を担います。機能ごとにディレクトリを分割し、スケーラビリティと保守性を高めた設計となっています。

## 技術スタック

- **コア**: React (v19), TypeScript
- **ビルドツール**: Vite (v7)
- **UIコンポーネント**: Material-UI (MUI) v7, Emotion
- **状態管理**: Redux Toolkit, React Redux
- **ルーティング**: React Router DOM (v7)
- **ドラッグ＆ドロップ**: @dnd-kit
- **テスト**: Vitest, React Testing Library
- **その他**: react-calendar, react-clock, qrcode.react, axios

## ディレクトリ構成（主要な機能）

`src/features/` 配下に、ドメイン領域（機能）ごとにモジュールが分割されています。

```text
src/features/
  ├─ auth/                 # 認証機能
  ├─ session/              # セッション管理
  ├─ servers/              # サーバー管理機能
  ├─ channels/             # チャンネル管理機能
  ├─ reminders/            # リマインダー管理機能
  ├─ supporters/           # サポーター関連機能
  ├─ auditLog/             # 監査ログ閲覧機能
  ├─ emojis/               # 絵文字関連
  ├─ missed-notifications/ # 未読通知管理
  ├─ toast/                # トースト通知・アラート
  └─ HitTheWorld/          # HitTheWorld 関連連携・機能
```

## APIとの連携（環境変数）

本アプリケーションは、バックエンドの **Cycle Reminder API** と通信を行います。
通信先のURLは環境変数 `VITE_API_BASE_URL` によって制御されます。

プロジェクトルートの `.env` または `.env.local` において、接続先を設定してください。

- **ローカル開発環境の例** (`.env` に記載)
  ```env
  VITE_API_BASE_URL=http://localhost:8080/api
  ```

- **検証・本番環境の例** (`.env.local` やホスティング環境で設定)
  ```env
  VITE_API_BASE_URL=https://cycle-reminder-api.fly.dev/api
  ```

※ `.env` ファイル等の環境変数を変更した場合は、開発サーバー（`npm run dev`）の再起動が必要です。

## 開発環境のセットアップ

### インストール

```bash
npm install
```

### スクリプト

- **開発サーバーの起動**
  ```bash
  npm run dev
  ```
  ローカル開発環境が起動し、HMR（Hot Module Replacement）が有効になります。

- **本番用ビルド**
  ```bash
  npm run build
  ```
  最適化された本番用アセットが `dist` ディレクトリに出力されます。

- **ローカルプレビュー**
  ```bash
  npm run preview
  ```
  ビルド後の成果物をローカルで動作確認します。

- **静的解析 (Lint)**
  ```bash
  npm run lint
  ```
  ESLint を用いてコードの静的解析を行います。

- **テスト**
  ```bash
  npm run test
  ```
  Vitest を利用したテストを実行します。
