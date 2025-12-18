# Firebase セットアップガイド

初めてFirebaseを使う方向けに、アカウント作成から設定キーの取得までをステップバイステップで解説します。

## 1. Googleアカウントの準備
FirebaseはGoogleのサービスですので、Googleアカウントが必要です。すでにお持ちの場合はそのまま使えます。

## 2. Firebaseプロジェクトの作成
1.  [Firebase Console](https://console.firebase.google.com/) にアクセスします。
2.  「**プロジェクトを作成**」 (Create a project) をクリックします。
3.  プロジェクト名を入力します（例: `news-unpacked-v1` など、なんでもOKです）。
4.  「続行」をクリックします。
5.  Googleアナリティクスの設定：このアプリでは不要ですので、**無効**（スイッチをオフ）にして「プロジェクトを作成」をクリックすると早いです。（有効にしても問題ありません）
6.  少し待つと「新しいプロジェクトの準備ができました」と表示されるので、「続行」をクリックします。

## 3. Webアプリの登録とAPIキーの取得
1.  プロジェクトの概要ページ（Top画面）の中央付近にあるアイコンの中から、「**Web**」のアイコン（**`</>`** のようなマーク）をクリックします。
2.  **アプリのニックネーム**を入力します（例: `Playroom`）。
    *   「このアプリの Firebase Hosting も設定します」のチェックは**不要**です。
3.  「**アプリを登録**」をクリックします。
4.  「**Firebase SDK の追加**」という画面にならずに、設定コードが表示されます。
    *   `const firebaseConfig = { ... }` という部分に注目してください。
    *   ここに書かれている `apiKey`, `authDomain` などの値が、`.env` ファイルに必要な情報です。

### `.env` ファイルへの書き写し方
プロジェクトフォルダにある `.env` ファイル（無ければ作成）に、以下のように値をコピペしてください。
*   `apiKey: "AIza..."` → `VITE_FIREBASE_API_KEY=AIza...`
*   `authDomain: "..."` → `VITE_FIREBASE_AUTH_DOMAIN=...`
（クォーテーション `"` やカンマ `,` は不要です）

例:
```env
VITE_FIREBASE_API_KEY=AIzaSyDxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=news-unpacked.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=news-unpacked
VITE_FIREBASE_STORAGE_BUCKET=news-unpacked.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxxx
```

## 4. Firestore (データベース) の有効化
**これを行わないと、ルーム作成時にエラーになります！**

1.  Firebase Consoleの左メニューから「**構築 (Build)**」を開き、「**Firestore Database**」をクリックします。
2.  「**データベースの作成** (Create database)」ボタンをクリックします。
3.  **データベースのロケーション**：
    *   `asia-northeast1` (Tokyo) または `us-central1` など、近い場所を選ぶと良いですが、デフォルトのままでも動きます。
    *   「次へ」をクリック。
4.  **セキュリティルール**：
    *   「**テストモードで開始する** (Start in test mode)」を選択してください。
    *   ※これは30日間、誰でも読み書き可能にする設定です。開発中はこれでOKです。
5.  「**有効にする** (Enable)」をクリックします。

これで準備完了です！
VSCodeなどのターミナルで `npm run dev` を再起動（Ctrl+C で止めてから実行）し、ルーム作成を試してみてください。
