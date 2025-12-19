# 開発者ガイド (Development Guide)

このドキュメントは、News Unpackedのローカル開発環境のセットアップと、開発に関する技術的な詳細をまとめています。

## 🛠 セットアップ (ローカル環境)

### 1. リポジトリのクローンと依存関係のインストール

```bash
git clone <repository-url>
cd news-unpacked
npm install
```

### 2. 環境変数の設定 (Firebase)

このアプリはバックエンドに **Firebase Firestore** を使用します。
ルートディレクトリに `.env` ファイルを作成し、自身のFirebaseプロジェクトの設定値を記述してください。

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
```

詳細は `FIREBASE_SETUP.md` も参照してください。

### 3. 開発サーバーの起動

```bash
npm run dev
```
`http://localhost:5173` でアプリが起動します。

---

## 📜 利用可能なスクリプト

`package.json` に定義されている主要なコマンドです。

- **`npm run dev`**: ローカル開発サーバーを起動します。
- **`npm run build`**: 本番用のビルドを行います（`tsc` による型チェックと `vite build`）。
- **`npm run preview`**: ビルド後のファイルをローカルでプレビューします。
- **`npm run deploy`**: `gh-pages` を使用してGitHub Pagesにデプロイします。

---

## 📂 ディレクトリ構成

- `src/components/game/board/`: ボード画面の主要コンポーネント（カード、タイマー、チャットなど）
- `src/hooks/`: カスタムフック (`useRoomSync`, `usePlayer` など)
- `src/services/`: Firebase連携ロジック (`firebase.ts`, `roomService.ts`)
- `src/types/`: TypeScriptの型定義
