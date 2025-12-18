import React from 'react';
import { useParams } from 'react-router-dom';

import { Lobby } from '../components/game/Lobby';
import { Preparation } from '../components/game/Preparation';
import { Board } from '../components/game/Board';
import { Summary } from '../components/game/Summary';

import { CyberBackground } from '../components/ui/CyberBackground';
import { usePlayer } from '../hooks/usePlayer';
import { useRoomSync } from '../hooks/useRoomSync';

// ゲームルーム画面のルートコンポーネント
export const Room: React.FC = () => {
    const { roomId } = useParams();

    // カスタムフックを使用して状態を取得
    const player = usePlayer();
    const { room, loading } = useRoomSync(roomId, player?.id);

    if (loading || !room || !player) return <div className="text-white text-center p-10">Loading room...</div>;

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
