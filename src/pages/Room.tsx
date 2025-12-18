import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Room as RoomType } from '../types/game';

import { Lobby } from '../components/game/Lobby';
import { Preparation } from '../components/game/Preparation';
import { Board } from '../components/game/Board';
import { Summary } from '../components/game/Summary';

import { CyberBackground } from '../components/ui/CyberBackground';

// ゲームルーム画面のルートコンポーネント
export const Room: React.FC = () => {
    const { roomId } = useParams();
    const [room, setRoom] = useState<RoomType | null>(null);
    const [player, setPlayer] = useState<any>(null); // TODO: Define strict type for local player state

    // ローカルストレージからプレイヤー情報を復元
    useEffect(() => {
        const p = localStorage.getItem('neun_player');
        if (p) setPlayer(JSON.parse(p));
    }, []);

    // Firestoreからルーム情報をリアルタイム監視
    useEffect(() => {
        if (!roomId) return;

        const unsub = onSnapshot(doc(db, 'rooms', roomId), (doc) => {
            if (doc.exists()) {
                setRoom(doc.data() as RoomType);
            }
        });

        // クリーンアップ関数：コンポーネントのアンマウント時（画面遷移時など）に実行
        return () => {
            unsub();
            if (player?.id) {
                // 非同期関数なのでfire-and-forgetで実行
                import('../services/roomService').then(({ leaveRoom }) => {
                    leaveRoom(roomId, player.id).catch(console.error);
                });
            }
        };
    }, [roomId, player?.id]);

    if (!room || !player) return <div className="text-white text-center p-10">Loading room...</div>;

    // 現在のプレイヤーがホストかどうか判定
    const isHost = room.players.find(p => p.id === player.id)?.isHost || false;

    return (
        <div className="min-h-screen p-4 relative text-white">
            <CyberBackground />
            {/* Navigation: Home (Visible during setup) */}
            {room.status === 'lobby' && (
                <Lobby roomId={room.id} players={room.players} isHost={isHost} settings={room.settings} />
            )}
            {room.status === 'preparation' && (
                <Preparation room={room} currentPlayerId={player.id} />
            )}
            {(room.status === 'selection' || room.status === 'discussion') && (
                <Board room={room} playerId={player.id} isHost={isHost} />
            )}
            {room.status === 'summary' && (
                <Summary room={room} isHost={isHost} />
            )}
            {/* Future phases: selection, discussion */}
        </div>
    );
};
