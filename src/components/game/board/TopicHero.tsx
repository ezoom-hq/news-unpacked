import React from 'react';
import { motion } from 'framer-motion';
import { Topic, Player } from '../../../types/game';

interface TopicHeroProps {
    topic: Topic;
    roomPlayers: Player[];
    isHost: boolean;
    onReveal: () => void;
    onReaction: (emoji: string) => void;
}

/**
 * 議論中のメイントピックカードコンポーネント
 * お題の表示、伏せ字のオープン、リアクションボタン機能を提供します。
 */
export const TopicHero: React.FC<TopicHeroProps> = ({
    topic,
    roomPlayers,
    isHost,
    onReveal,
    onReaction
}) => {
    return (
        <div className="glass-panel rounded-3xl p-4 md:p-8 w-full h-full flex flex-col items-center justify-between text-center relative overflow-hidden backdrop-blur-xl border border-white/20 shadow-2xl shadow-purple-900/20">

            <div className="flex-none flex flex-col items-center gap-1 mb-4">
                <h3 className="text-indigo-200/50 text-[20px] font-bold uppercase tracking-[0.3em]">現在のお題</h3>
                <div className="text-zinc-500 text-[20px] font-medium tracking-wider">
                    作成者: {roomPlayers.find(p => p.id === topic.authorId)?.name || 'Unknown'}
                </div>
            </div>

            {/* Main Text Content - Scrollable area */}
            <div className="flex-1 flex items-center justify-center w-full min-h-0 relative">
                <div className="w-full max-h-full overflow-y-auto px-4 custom-scrollbar-thin">
                    <div className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-snug drop-shadow-lg break-words py-4">
                        {topic.isRevealed ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                transition={{ type: "spring", bounce: 0.5 }}
                                className="premium-gradient-text"
                            >
                                {topic.originalText}
                            </motion.div>
                        ) : (
                            <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                                {topic.originalText.split('').map((char, index) => {
                                    const isHidden = topic.maskIndices.includes(index);
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
                {isHost && !topic.isRevealed && (
                    <button
                        onClick={onReveal}
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
                            onClick={() => onReaction(emoji)}
                            className="w-10 h-10 md:w-12 md:h-12 bg-white/5 backdrop-blur-sm rounded-full hover:bg-white/20 text-xl md:text-2xl transition active:scale-75 flex items-center justify-center border border-white/5"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
};
