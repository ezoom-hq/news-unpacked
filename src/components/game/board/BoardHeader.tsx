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
            <div className="max-w-7xl mx-auto px-2 md:px-4 py-2 md:py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                {/* Left: Status & Players */}
                <div className="flex flex-col gap-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <div className="text-white font-bold px-2 py-0.5 bg-white/10 rounded border border-white/10 uppercase tracking-widest text-[10px] flex-none">
                            {room.status === 'discussion' ? 'DISCUSS' : room.status}
                        </div>
                    </div>
                    {/* Player List - Scrollable */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-gradient-right w-full">
                        {room.players.map(p => (
                            <div key={p.id} className="flex-none flex items-center gap-1 text-[10px] text-gray-400 bg-black/20 px-1.5 py-0.5 rounded-full border border-white/5 whitespace-nowrap">
                                <span className={`w-1.5 h-1.5 rounded-full ${p.isHost ? 'bg-indigo-400' : 'bg-emerald-500/80'}`}></span>
                                {p.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center: Timer */}
                <div className="flex items-center justify-center min-w-[30px]">
                    {room.status === 'discussion' && (
                        <div className="scale-75 md:scale-100 origin-center">
                            <Timer
                                initialSeconds={room.settings?.discussionTime || 180}
                                isRunning={true}
                                triggerExtension={room.latestExtension}
                            />
                        </div>
                    )}
                </div>

                {/* Right: Controls (Host only) */}
                <div className="flex items-center justify-end gap-1 md:gap-2">
                    {isHost && (
                        <>
                            {room.status === 'discussion' && (
                                <>
                                    <button
                                        onClick={onExtendTimer}
                                        className="px-2 py-1.5 rounded bg-indigo-600/50 hover:bg-indigo-600 text-white text-[10px] md:text-xs font-bold border border-indigo-400/30 whitespace-nowrap"
                                    >
                                        +60
                                    </button>
                                    <button
                                        onClick={onBackToSelection}
                                        className="px-2 py-1.5 rounded bg-gray-700/80 hover:bg-gray-600 text-white text-[10px] md:text-xs font-bold border border-gray-600 whitespace-nowrap hidden md:block"
                                    >
                                        次へ
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onFinishGame}
                                className="px-2 py-1.5 rounded bg-red-900/50 hover:bg-red-800 text-red-100 text-[10px] md:text-xs font-bold border border-red-800/50 whitespace-nowrap"
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
