import React from 'react';
import { Room } from '../../types/game';
import { TopicCard } from './TopicCard';
import { Timer } from './Timer';
import { ReactionSystem, sendReaction } from './ReactionSystem';
import { ChatSystem } from './ChatSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface BoardProps {
    room: Room;
    playerId: string;
    isHost: boolean;
}

export const Board: React.FC<BoardProps> = ({ room, isHost, playerId }) => {
    // 現在のプレイヤー名を取得（チャット用）
    const currentPlayerName = room.players.find(p => p.id === playerId)?.name || "Unknown";

    // お題を選択して議論を開始するハンドラ（ホストのみ）
    const handleSelectTopic = async (topicId: string) => {
        if (!isHost) return;
        const roomRef = doc(db, 'rooms', room.id);

        await updateDoc(roomRef, {
            status: 'discussion',     // ステータスを議論中に変更
            currentTopicId: topicId,  // 選択されたお題IDをセット
        });
    };

    // お題の正解（伏せ字）をオープンにするハンドラ
    const handleReveal = async () => {
        if (!isHost || !room.currentTopicId) return;
        const topicIndex = room.topics.findIndex(t => t.id === room.currentTopicId);
        if (topicIndex === -1) return;

        // 対象のトピックの isRevealed フラグを更新するため、トピックリスト全体を更新
        const newTopics = [...room.topics];
        newTopics[topicIndex] = { ...newTopics[topicIndex], isRevealed: true };

        await updateDoc(doc(db, 'rooms', room.id), {
            topics: newTopics
        });
    };

    // 議論を終了し、お題選択画面に戻るハンドラ
    const handleBackToSelection = async () => {
        if (!isHost) return;

        await updateDoc(doc(db, 'rooms', room.id), {
            status: 'selection',
            currentTopicId: null // 選択中のお題をリセット
        });
    };

    // ゲーム全体を終了し、サマリー画面へ進むハンドラ
    const handleFinishGame = async () => {
        if (!isHost) return;
        await updateDoc(doc(db, 'rooms', room.id), {
            status: 'summary'
        });
    }

    const handleExtendTimer = async () => {
        if (!isHost) return;
        await updateDoc(doc(db, 'rooms', room.id), {
            latestExtension: Date.now()
        });
    };

    const currentTopic = room.topics.find(t => t.id === room.currentTopicId);

    return (
        // Root Container: Fixed Inset-0 to guarantee no global scroll, Flex Column for layout
        <div className="fixed inset-0 w-full h-full text-white overflow-hidden flex flex-col">

            {/* Header: Flex None (Fixed H), High Z-index */}
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
                                            onClick={handleExtendTimer}
                                            className="px-3 py-2 rounded-lg bg-indigo-600/50 hover:bg-indigo-600 text-white text-[10px] md:text-xs font-bold border border-indigo-400/30 transition shadow-lg whitespace-nowrap"
                                        >
                                            +60秒
                                        </button>
                                        <button
                                            onClick={handleBackToSelection}
                                            className="px-4 py-2 rounded-lg bg-gray-700/80 hover:bg-gray-600 text-white text-[10px] md:text-xs font-bold border border-gray-600 transition shadow-lg whitespace-nowrap hidden md:block"
                                        >
                                            次へ
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={handleFinishGame}
                                    className="px-4 py-2 rounded-lg bg-red-900/50 hover:bg-red-800 text-red-100 text-[10px] md:text-xs font-bold border border-red-800/50 transition shadow-lg whitespace-nowrap"
                                >
                                    終了
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content: Flex-1 (Takes remaining space), Min-H-0 (Allow shrink), Scrollable inside if needed */}
            <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto p-4 z-10 relative flex flex-col">
                <AnimatePresence mode="wait">
                    {/* Selection Phase */}
                    {room.status === 'selection' && (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20 content-start custom-scrollbar"
                        >
                            {room.topics
                                .map((topic, i) => ({ topic, originalIndex: i + 1 }))
                                .sort((a, b) => {
                                    if (a.topic.isRevealed === b.topic.isRevealed) return 0;
                                    return a.topic.isRevealed ? 1 : -1;
                                })
                                .map(({ topic, originalIndex }) => {
                                    const author = room.players.find(p => p.id === topic.authorId);
                                    return (
                                        <TopicCard
                                            key={topic.id}
                                            topic={topic}
                                            onClick={() => handleSelectTopic(topic.id)}
                                            // Hostのみ選択可能
                                            disabled={!isHost}
                                            isFinished={topic.isRevealed} // 議論済みかどうか
                                            authorName={author?.name}
                                            topicIndex={originalIndex}
                                        />
                                    );
                                })}
                        </motion.div>
                    )}

                    {/* Discussion Phase */}
                    {room.status === 'discussion' && currentTopic && (
                        <motion.div
                            key="active"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col md:flex-row w-full h-full gap-4 min-h-0"
                        >
                            {/* Left: Main Topic Card (Hero) */}
                            {/* Flex-1 ensures it fills space. min-h-0 ensures it shrinks. */}
                            <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
                                <div className="glass-panel rounded-3xl p-4 md:p-8 w-full h-full flex flex-col items-center justify-between text-center relative overflow-hidden backdrop-blur-xl border border-white/20 shadow-2xl shadow-purple-900/20">

                                    <div className="flex-none flex flex-col items-center gap-1 mb-4">
                                        <h3 className="text-indigo-200/50 text-[20px] font-bold uppercase tracking-[0.3em]">現在のお題</h3>
                                        <div className="text-zinc-500 text-[20px] font-medium tracking-wider">
                                            作成者: {room.players.find(p => p.id === currentTopic.authorId)?.name || 'Unknown'}
                                        </div>
                                    </div>

                                    {/* Main Text Content - Scrollable area */}
                                    <div className="flex-1 flex items-center justify-center w-full min-h-0 relative">
                                        <div className="w-full max-h-full overflow-y-auto px-4 custom-scrollbar-thin">
                                            <div className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-snug drop-shadow-lg break-words py-4">
                                                {currentTopic.isRevealed ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                                        transition={{ type: "spring", bounce: 0.5 }}
                                                        className="premium-gradient-text"
                                                    >
                                                        {currentTopic.originalText}
                                                    </motion.div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                                                        {currentTopic.originalText.split('').map((char, index) => {
                                                            const isHidden = currentTopic.maskIndices.includes(index);
                                                            return (
                                                                <span
                                                                    key={index}
                                                                    className={`
                                                                        rounded-lg transition-all duration-500 flex items-center justify-center
                                                                        ${isHidden
                                                                            ? 'bg-indigo-900/40 text-transparent min-w-[2rem] md:min-w-[3rem] h-10 md:h-14 border-2 border-dashed border-indigo-500/30'
                                                                            : 'text-white'}
                                                                    `}
                                                                >
                                                                    {isHidden ? '' : char}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Controls Area */}
                                    <div className="flex-none w-full flex flex-col items-center gap-4 mt-4 pt-4 border-t border-white/5 relative z-20">
                                        {/* Reveal Button */}
                                        {isHost && !currentTopic.isRevealed && (
                                            <button
                                                onClick={handleReveal}
                                                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-2 md:px-10 md:py-3 rounded-full font-bold text-lg shadow-lg shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20"
                                            >
                                                オープン
                                            </button>
                                        )}

                                        {/* Reaction Buttons */}
                                        <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
                                            {['👍', '🤔', '😂', '👏', '🎉', '😯'].map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => sendReaction(room.id, emoji)}
                                                    className="w-10 h-10 md:w-12 md:h-12 bg-white/5 backdrop-blur-sm rounded-full hover:bg-white/20 text-xl md:text-2xl transition active:scale-75 flex items-center justify-center border border-white/5"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                                <ReactionSystem roomId={room.id} />
                            </div>

                            {/* Right: Chat System */}
                            {/* Adjusted height for mobile to prevent overflow. flex-none ensures it keeps size. */}
                            <div className="w-full md:w-[350px] flex-none h-[35vh] md:h-auto z-20">
                                <ChatSystem
                                    roomId={room.id}
                                    topicId={currentTopic.id}
                                    playerName={currentPlayerName}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};
