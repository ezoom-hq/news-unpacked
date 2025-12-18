import { db } from './firebase';
import { doc, setDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { Room, Player, Topic } from '../types/game';
import { generateRoomId } from '../utils/randomId';

// 新しいゲームルームを作成する関数
export const createRoom = async (hostName: string): Promise<{ roomId: string, player: Player }> => {
    const roomId = generateRoomId();
    // Firestoreのroomsコレクション内の特定のルームIDを持つドキュメントへの参照を作成
    const roomRef = doc(db, 'rooms', roomId);

    // ホストプレイヤーの初期化
    const hostPlayer: Player = {
        id: crypto.randomUUID(), // 一意なIDを生成
        name: hostName,
        isHost: true,
    };

    // 初期ルームデータを作成
    const initialRoom: Room = {
        id: roomId,
        status: 'lobby',
        players: [hostPlayer],
        topics: [],
        createdAt: Date.now(),
        settings: {
            discussionTime: 1800, // デフォルト30分
            maxTopicsPerPlayer: 5 // デフォルト5つ
        }
    };

    try {
        // Firestoreに新しいルームドキュメントを設定（既に存在する場合は上書きされるため、実運用では存在チェック推奨）
        await setDoc(roomRef, initialRoom);
        return { roomId, player: hostPlayer };
    } catch (error) {
        console.error("Error creating room:", error);
        throw error;
    }
};

// 既存のルームに参加する関数
export const joinRoom = async (roomId: string, playerName: string): Promise<{ player: Player }> => {
    // Firestoreのroomsコレクション内の特定のルームIDを持つドキュメントへの参照を作成
    const roomRef = doc(db, 'rooms', roomId);

    // トランザクションを使用して、同時参加による競合を防ぐ
    const playerId = crypto.randomUUID(); // 参加プレイヤーの一意なIDを生成

    // 新しい参加プレイヤーの情報を初期化
    const newPlayer: Player = {
        id: playerId,
        name: playerName,
        isHost: false, // 参加者はホストではない
    };

    await runTransaction(db, async (transaction) => {
        // トランザクション内でルームドキュメントを取得
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) {
            throw new Error("部屋が見つかりません");
        }

        // 取得したルームデータを型アサーション
        const roomData = roomDoc.data() as Room;

        // ゲームが既に始まっている場合は参加を拒否するためのチェックをここに追加可能
        // if (roomData.status !== 'lobby') throw new Error("ゲームは既に進行中です");

        // 既存のプレイヤーリストに新しいプレイヤーを追加
        const newPlayers = [...roomData.players, newPlayer];
        // トランザクション内でルームドキュメントを更新
        transaction.update(roomRef, { players: newPlayers });
    });

    return { player: newPlayer };
};

// お題を追加する関数
export const addTopic = async (roomId: string, topic: Topic) => {
    const roomRef = doc(db, 'rooms', roomId);
    // 配列フィールドに要素を追加（arrayUnionは重複がない場合のみ追加）
    await updateDoc(roomRef, {
        topics: arrayUnion(topic)
    });
};

// ゲームを開始する関数（ステータスを準備画面へ移行）
export const startGame = async (roomId: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
        status: 'preparation'
    });
};

// 部屋から退出する関数
export const leaveRoom = async (roomId: string, playerId: string) => {
    const roomRef = doc(db, 'rooms', roomId);

    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) return;

        const roomData = roomDoc.data() as Room;
        const newPlayers = roomData.players.filter(p => p.id !== playerId);

        // プレイヤーが0人になったら部屋を削除してもいいかもですが、
        // とりあえずプレイヤーリストからの削除のみ行います。
        transaction.update(roomRef, { players: newPlayers });
    });
};
