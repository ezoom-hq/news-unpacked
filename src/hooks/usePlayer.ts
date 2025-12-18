import { useState, useEffect } from 'react';
import { Player } from '../types/game';

// ローカルストレージ内のプレイヤー情報のキー
const PLAYER_STORAGE_KEY = 'neun_player';

/**
 * プレイヤーの状態を管理するカスタムフック
 * ローカルストレージからプレイヤー情報を読み込み、保持します。
 */
export const usePlayer = () => {
    const [player, setPlayer] = useState<Player | null>(null);

    useEffect(() => {
        const storedPlayer = localStorage.getItem(PLAYER_STORAGE_KEY);
        if (storedPlayer) {
            try {
                setPlayer(JSON.parse(storedPlayer));
            } catch (e) {
                console.error("Failed to parse player data", e);
            }
        }
    }, []);

    return player;
};
