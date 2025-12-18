import React from 'react';
import { Room } from '../../../types/game';
import { Timer } from './Timer';

interface BoardHeaderProps {
    room: Room;
    isHost: boolean;
    onExtendTimer: () => void;
    onBackToSelection: () => void;
    onFinishGame: () => void;
}

/**
 * ゲームボードのヘッダーコンポーネント
 * ステータス表示、プレイヤーリスト、タイマー、ホスト用コントロールを含みます。
 */
export const BoardHeader: React.FC<BoardHeaderProps> = ({
    room,
    isHost,
    onExtendTimer,
    onBackToSelection,
    onFinishGame
}) => {
    return (
        <header className="flex-none z-50 w-full bg-gray-900/80 backdrop-blur-md border-b border-white/10 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-3 items-center">
                {/* Left: Status & Players */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 overflow-hidden">
                    <div className="text-white font-bold px-3 py-1 bg-white/10 rounded border border-white/10 uppercase tracking-widest text-[10px] md:text-xs flex-none">
                        {room.status}
                    </div>
                    {/* Player List */}
                    <div className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar mask-gradient-right max-w-[120px] md:max-w-none px-1">
                        {room.players.map(p => (
                            <div key={p.id} className="flex-none flex items-center gap-1 text-[10px] md:text-xs text-gray-400 bg-black/20 px-2 py-0.5 rounded-full border border-white/5 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                                {p.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center: Timer (Always centered in grid) */}
                <div className="flex items-center justify-center">
                    {room.status === 'discussion' && (
                        <Timer
                            initialSeconds={room.settings?.discussionTime || 180}
                            isRunning={true}
                            triggerExtension={room.latestExtension}
                        />
                    )}
                </div>

                {/* Right: Controls (Host only) */}
                <div className="flex items-center justify-end gap-2">
                    {isHost && (
                        <>
                            {room.status === 'discussion' && (
                                <>
                                    <button
                                        onClick={onExtendTimer}
                                        className="px-3 py-2 rounded-lg bg-indigo-600/50 hover:bg-indigo-600 text-white text-[10px] md:text-xs font-bold border border-indigo-400/30 transition shadow-lg whitespace-nowrap"
                                    >
                                        +60秒
                                    </button>
                                    <button
                                        onClick={onBackToSelection}
                                        className="px-4 py-2 rounded-lg bg-gray-700/80 hover:bg-gray-600 text-white text-[10px] md:text-xs font-bold border border-gray-600 transition shadow-lg whitespace-nowrap hidden md:block"
                                    >
                                        次へ
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onFinishGame}
                                className="px-4 py-2 rounded-lg bg-red-900/50 hover:bg-red-800 text-red-100 text-[10px] md:text-xs font-bold border border-red-800/50 transition shadow-lg whitespace-nowrap"
                            >
                                終了
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};
