import { Player, TopicCategory } from '../../types/game';
import { startGame } from '../../services/roomService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GACHA_DATA } from '../../data/gachaTopics';
import { Link } from 'react-router-dom';

interface LobbyProps {
    roomId: string;
    players: Player[];
    isHost: boolean;
    settings?: {
        discussionTime: number;
        maxTopicsPerPlayer: number;
        gachaCategories?: TopicCategory[];
    };
}

export const Lobby: React.FC<LobbyProps> = ({ roomId, players, isHost, settings }) => {
    // ローカルでの設定編集用ステート（ホストのみ使用）
    // 通常はprops経由でFirestoreからの同期データを受け取りますが、
    // 入力フォームのUI制御のために直接Firestoreを更新する方式を採用しています。

    // 設定変更時のハンドラ
    // UX向上のため、入力変更時に即時（あるいはデバウンスで）Firestoreを更新します。
    // キー名（discussionTimeなど）を動的に受け取って更新します。
    const updateSettings = async (key: string, value: any) => {
        if (!isHost) return;
        await updateDoc(doc(db, 'rooms', roomId), {
            [`settings.${key}`]: value
        });
    };

    const toggleCategory = (catId: TopicCategory) => {
        if (!isHost) return;
        // 未設定(undefined)の場合は全カテゴリが有効とみなすため、全リストから開始
        const current = settings?.gachaCategories || GACHA_DATA.map(c => c.id);
        let next: TopicCategory[];

        if (current.includes(catId)) {
            // 削除（ただし最後の一つは削除させない）
            if (current.length <= 1) return;
            next = current.filter(c => c !== catId);
        } else {
            // 追加
            next = [...current, catId];
        }
        updateSettings('gachaCategories', next);
    };

    const handleStart = async () => {
        try {
            await startGame(roomId);
        } catch (e) {
            console.error(e);
            alert("ゲームの開始に失敗しました");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full max-w-2xl mx-auto text-white">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/" className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition text-gray-300 hover:text-white" title="ホームに戻る">
                    ←
                </Link>
                <h2 className="text-3xl font-bold">ルームID: {roomId}</h2>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 w-full shadow-2xl border border-white/10 mb-6">
                <h3 className="text-xl text-gray-200 mb-4 border-b border-gray-600 pb-2">設定</h3>
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">⏰ 議論時間 (秒)</label>
                        {isHost ? (
                            <input
                                type="number"
                                value={settings?.discussionTime || 60}
                                onChange={(e) => updateSettings('discussionTime', Number(e.target.value))}
                                className="w-full bg-black/20 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                        ) : (
                            <div className="text-xl font-bold">{settings?.discussionTime || 60} 秒</div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">📝 1人あたりのお題数</label>
                        {isHost ? (
                            <input
                                type="number"
                                value={settings?.maxTopicsPerPlayer || 3}
                                onChange={(e) => updateSettings('maxTopicsPerPlayer', Number(e.target.value))}
                                className="w-full bg-black/20 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                        ) : (
                            <div className="text-xl font-bold">{settings?.maxTopicsPerPlayer || 3} 個</div>
                        )}
                    </div>
                </div>

                {/* Gacha Category Selection */}
                <div className="border-t border-gray-600 pt-4">
                    <label className="block text-sm text-gray-400 mb-3">🎲 ガチャのテーマ設定</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {GACHA_DATA.map(cat => {
                            const currentCategories = settings?.gachaCategories || GACHA_DATA.map(c => c.id);
                            const isActive = currentCategories.includes(cat.id);
                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => toggleCategory(cat.id)}
                                    className={`
                                        p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1
                                        ${isActive
                                            ? 'bg-indigo-600/20 border-indigo-400 text-white'
                                            : 'bg-black/20 border-gray-700 text-gray-500 hover:bg-gray-700/50'}
                                        ${!isHost ? 'pointer-events-none' : ''}
                                    `}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm">{cat.label}</span>
                                        {isActive && <span className="text-indigo-400">✓</span>}
                                    </div>
                                    <span className="text-xs opacity-70">{cat.description}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 w-full shadow-2xl border border-white/10">
                <h3 className="text-xl text-gray-200 mb-4 border-b border-gray-600 pb-2">参加者 ({players.length}/6)</h3>
                <ul className="space-y-3">
                    {players.map(p => (
                        <li key={p.id} className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${p.isHost ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-green-400'}`}></div>
                                <span className="font-medium text-lg">{p.name}</span>
                            </div>
                            {p.isHost && <span className="text-xs font-bold bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">ホスト</span>}
                        </li>
                    ))}
                </ul>

                {isHost ? (
                    <button
                        onClick={handleStart}
                        className="w-full mt-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-lg rounded-lg shadow-lg transform transition hover:scale-[1.02]"
                    >
                        ゲーム開始
                    </button>
                ) : (
                    <div className="mt-8 text-center text-gray-400 animate-pulse">
                        ホストが開始するのを待っています...
                    </div>
                )}
            </div>
        </div>
    );
};
