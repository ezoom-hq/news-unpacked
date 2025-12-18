// プレイヤー情報を定義します
export interface Player {
    id: string;      // プレイヤーの一意なID
    name: string;    // 表示名
    isHost: boolean; // ホスト（部屋作成者）かどうか
}

export interface ChatMessage {
    id: string;
    topicId: string | null;
    text: string;
    authorName: string;
    createdAt: number;
}

// ゲームの進行状態を表す型
// lobby: 待機画面
// preparation: お題入力・準備フェーズ
// selection: 議論するお題を選択するフェーズ
// discussion: 実際に議論を行うフェーズ
// summary: 結果発表・サマリー画面
export type GameStatus = 'lobby' | 'preparation' | 'selection' | 'discussion' | 'summary';

// お題（トピック）のデータ構造
export interface Topic {
    id: string;            // トピックの一意なID
    authorId: string;      // 作成者のプレイヤーID
    originalText: string;  // 入力された元のテキスト
    maskIndices: number[]; // 伏せ字にする文字のインデックス配列（例: [0, 2]なら1文字目と3文字目を隠す）
    isRevealed: boolean;   // 正解（元の文）が公開されたかどうか
}

// UI表示用の伏せ字トークン（DB保存用ではなく、表示ロジックで使用）
export interface MaskToken {
    text: string;      // 文字
    isHidden: boolean; // 隠されているか
    id: string;        // Reactのkey用ID
}

// ガチャのお題カテゴリ
export type TopicCategory = 'basic' | 'discussion' | 'politics' | 'philosophy';

// 部屋の設定
export interface RoomSettings {
    discussionTime: number;          // 議論時間（秒）
    maxTopicsPerPlayer: number;      // 1人あたりのお題提出数
    gachaCategories?: TopicCategory[]; // 有効なガチャカテゴリ（未指定時は全対象）
}

// リアクションデータ
export interface ReactionData {
    emoji: string;
    timestamp: number;
    id: string;
}

// 部屋全体のデータ構造（Firestoreに保存されるルートオブジェクト）
export interface Room {
    id: string;                // 部屋ID（ユーザー入力または自動生成）
    status: GameStatus;        // 現在の進行フェーズ
    players: Player[];         // 参加プレイヤーのリスト
    topics: Topic[];           // 提出されたお題のリスト
    currentTopicId?: string;   // 現在議論中のお題ID
    settings: RoomSettings;    // ゲーム設定
    createdAt: number;         // 作成日時（タイムスタンプ）

    // リアルタイム機能用データ
    latestReaction?: ReactionData;      // 最新のリアクション情報（同期トリガー用）
    latestExtension?: number;  // タイマー延長トリガー（タイムスタンプ）
}
