import React from 'react';
import { Topic } from '../../types/game';
import { motion } from 'framer-motion';

interface TopicCardProps {
    topic: Topic;
    onClick: () => void;
    disabled: boolean;
    isSelected?: boolean;
    isFinished?: boolean; // 議論済みかどうか
    authorName?: string;
    topicIndex: number;
}

export const TopicCard: React.FC<TopicCardProps> = ({ topic, onClick, disabled, isSelected, isFinished, authorName, topicIndex }) => {
    return (
        <motion.div
            layoutId={`card-${topic.id}`}
            onClick={!disabled ? onClick : undefined}
            className={`
                relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 flex flex-col gap-3 min-h-[180px]
                ${isFinished
                    ? 'bg-zinc-900/95 border-zinc-800 shadow-inner' // Finished: Deep dark
                    : 'bg-indigo-900/30 border-indigo-500/30 hover:bg-indigo-800/40 hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-500/20'} // Active: Indigo tint
                ${disabled ? 'cursor-default' : 'cursor-pointer'}
                ${isSelected ? 'ring-4 ring-yellow-400 scale-[1.02] z-10' : ''}
            `}
        >
            {isFinished && (
                <div className="absolute top-2 right-2 text-green-400 font-extrabold border border-green-500/80 rounded-full px-3 py-1 text-xs bg-green-950/90 shadow-lg tracking-wider z-20">
                    完了
                </div>
            )}

            <div className={`text-xs uppercase tracking-wider font-bold ${isFinished ? 'text-gray-500' : 'text-indigo-300'}`}>
                {isFinished && authorName ? `#${topicIndex} by ${authorName}` : `Topic #${topicIndex}`}
            </div>

            {/* Preview of the text (masked) */}
            <div className={`flex-1 text-lg font-bold leading-relaxed break-words ${isFinished ? 'text-gray-400' : 'text-white'}`}>
                {(isFinished || topic.isRevealed) ? (
                    // Reveal済み、または議論済みなら全文表示
                    <span>{topic.originalText}</span>
                ) : (
                    // それ以外はマスク処理
                    topic.originalText.split('').map((char, i) => (
                        <span key={i} className={topic.maskIndices.includes(i) ? 'text-indigo-400 bg-indigo-900/30 rounded px-0.5 mx-0.5' : ''}>
                            {topic.maskIndices.includes(i) ? '?' : char}
                        </span>
                    ))
                )}
            </div>


        </motion.div>
    );
};
