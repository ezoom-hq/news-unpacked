import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimerProps {
    initialSeconds: number;
    isRunning: boolean;
    onComplete?: () => void;
    triggerExtension?: number; // 延長するためのトリガー（変更されると時間が増える）
}

export const Timer: React.FC<TimerProps> = ({ initialSeconds, isRunning, onComplete, triggerExtension }) => {
    const [seconds, setSeconds] = useState(initialSeconds);
    // UseRef to track previous token without triggering re-renders/cleanups
    const prevExtensionTokenRef = useRef<number | undefined>(undefined);

    // エフェクト表示管理
    const [showEffect, setShowEffect] = useState(false);
    // エフェクト用のキー（連続クリック対応）
    const [effectKey, setEffectKey] = useState<number>(0);

    useEffect(() => {
        setSeconds(initialSeconds);
        prevExtensionTokenRef.current = undefined;
    }, [initialSeconds]);

    useEffect(() => {
        if (triggerExtension && triggerExtension !== prevExtensionTokenRef.current) {
            if (prevExtensionTokenRef.current !== undefined) {
                setSeconds(prev => prev + 60);

                // アニメーション発火
                setEffectKey(triggerExtension);
                setShowEffect(true);

                // 3秒かけてゆっくり消す (Soft fade)
                const timer = setTimeout(() => setShowEffect(false), 3000);

                prevExtensionTokenRef.current = triggerExtension;
                return () => clearTimeout(timer);
            } else {
                prevExtensionTokenRef.current = triggerExtension;
            }
        }
    }, [triggerExtension]);

    useEffect(() => {
        if (!isRunning || seconds <= 0) return;

        const interval = setInterval(() => {
            setSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    if (onComplete) onComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, seconds, onComplete]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const isUrgent = seconds <= 30;

    return (
        <div className="w-full flex justify-center items-center">
            {/* Wrapper for relative positioning */}
            <div className="relative">
                {/* Timer Box: Soft green glow transition */}
                <motion.div
                    key={`timer-box-${effectKey}`} // Key change triggers animation re-run
                    animate={showEffect ? {
                        backgroundColor: ['rgba(0,0,0,0.6)', 'rgba(22, 101, 52, 0.4)', 'rgba(0,0,0,0.6)'], // Soft transparent green
                        borderColor: ['rgba(255,255,255,0.2)', 'rgba(134, 239, 172, 0.8)', 'rgba(255,255,255,0.2)'], // Soft green border
                        boxShadow: ['0 0 0px rgba(74, 222, 128, 0)', '0 0 40px rgba(74, 222, 128, 0.4)', '0 0 0px rgba(74, 222, 128, 0)'] // Soft bloom
                    } : {}}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className={`
                        font-mono font-bold text-3xl px-6 py-3 rounded-xl bg-black/60 border-2 transition-colors duration-300 relative z-10
                        ${isUrgent && !showEffect
                            ? 'text-red-400 border-red-500/50 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                            : 'text-white border-white/20 shadow-lg'}
                    `}
                >
                    {formatTime(seconds)}
                </motion.div>

                {/* +60s Effect: Side Display, Soft Float */}
                <AnimatePresence>
                    {showEffect && (
                        <motion.div
                            key={`effect-text-${effectKey}`}
                            initial={{ opacity: 0, x: 0, scale: 0.9, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, x: 30, scale: 1.1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: 60, scale: 1.1, filter: 'blur(10px)' }} // Fade out moving further right
                            transition={{ duration: 2.0, ease: "easeOut" }} // Very slow and soft
                            className="absolute left-[80%] top-[20%] -translate-y-1/2 font-bold text-2xl ml-2 pointer-events-none z-0 whitespace-nowrap flex items-center gap-2"
                            style={{
                                color: '#86efac', // green-300 (Soft Green)
                                textShadow: '0 0 20px rgba(74, 222, 128, 0.5)' // Soft glow
                            }}
                        >
                            <span>+60秒</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
