import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Room } from '../types/game';
import { leaveRoom } from '../services/roomService';

/**
 * ルーム情報の同期とライフサイクルを管理するカスタムフック
 * @param roomId ルームID
 * @param playerId 現在のプレイヤーID（退出処理用）
 */
export const useRoomSync = (roomId: string | undefined, playerId: string | undefined) => {
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!roomId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Firestoreのリアルタイムリスナーを設定
        const unsub = onSnapshot(doc(db, 'rooms', roomId), (docSnapshot) => {
            if (docSnapshot.exists()) {
                setRoom(docSnapshot.data() as Room);
            } else {
                setRoom(null); // ルームが存在しない場合
            }
            setLoading(false);
        }, (error) => {
            console.error("Error syncing room:", error);
            setLoading(false);
        });

        // クリーンアップ：コンポーネントのアンマウント時（画面遷移時など）に実行
        return () => {
            unsub();
            if (playerId) {
                // 退出処理を実行（非同期）
                leaveRoom(roomId, playerId).catch(err => console.error("Failed to leave room:", err));
            }
        };
    }, [roomId, playerId]);

    return { room, loading };
};
