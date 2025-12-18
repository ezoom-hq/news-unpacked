# News Unpacked

議論をボードゲーム感覚で行うための、リアルタイム・オンラインツールです。
ZoomやDiscordなどの通話アプリと併用して、共通の画面を見ながら議論を深めるために使用します。

## 主な機能 (Features)
*   **ロビー (Lobby)**: 最大6人までのルーム作成・参加機能
*   **準備フェーズ (Preparation)**: お題の入力、ランダムお題ガチャ、伏せ字（マスク）作成機能
*   **メインボード (Board)**: ボードゲーム風のカード選択、議論タイム管理
*   **ツール類 (Tools)**: 画面上を飛び交う「リアクション」、簡易的な「ペン書き込み共有」
*   **サマリー (Summary)**: 議論ログの作成とクリップボードへのコピー

## セットアップ手順 (ローカル環境)

1.  リポジトリをクローンします。
2.  依存パッケージをインストールします。
    ```bash
    npm install
    ```
3.  Firebaseの設定に基づいて `.env` ファイルを作成します（後述）。
4.  開発サーバーを起動します。
    ```bash
    npm run dev
    ```

## 設定 (Firebase)

このアプリは **Firebase (Firestore)** をバックエンドとして使用します。

1.  [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成します。
2.  プロジェクト設定から **Web App** を作成します。
3.  **Firestore Database** を作成します（テストモード、または適切なルール設定で読み書きを許可してください）。
4.  取得した設定値を `.env` ファイルにコピーします：

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
```

※ 詳細は同梱の `FIREBASE_SETUP.md` を参照してください。

## デプロイ (GitHub Pages)

このプロジェクトはクライアントサイドルーティングを使用しています。GitHub Pagesへのデプロイ手順は以下の通りです：

1.  コードをGitHubにプッシュします。
2.  リポジトリの **Settings > Secrets and variables > Actions** に移動します。
3.  `.env` の各変数を Repository Secrets として追加します（例： `VITE_FIREBASE_API_KEY` 等）。
4.  GitHub Actions のワークフローを設定してビルド・デプロイを行います（標準的な Vite + GitHub Pages の構成）。

## ライセンス
MIT
