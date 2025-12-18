import React from 'react';
import { Room } from '../../types/game';
import { TopicCard } from './board/TopicCard';
import { ReactionSystem, sendReaction } from './board/ReactionSystem';
import { ChatSystem } from './board/ChatSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BoardHeader } from './board/BoardHeader';
import { TopicHero } from './board/TopicHero';

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

            <BoardHeader
                room={room}
                isHost={isHost}
                onExtendTimer={handleExtendTimer}
                onBackToSelection={handleBackToSelection}
                onFinishGame={handleFinishGame}
            />

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
                                <TopicHero
                                    topic={currentTopic}
                                    roomPlayers={room.players}
                                    isHost={isHost}
                                    onReveal={handleReveal}
                                    onReaction={(emoji) => sendReaction(room.id, emoji)}
                                />
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
