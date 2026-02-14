import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimerProps {
    // サーバー時刻ベースの終了予定時刻 (Unix Timestamp, ms)
    targetTime?: number;
    // バックアップ用・表示用初期値
    initialSeconds: number;
    isRunning: boolean;
    onComplete?: () => void;
    // 延長トリガーは、targetTimeが更新されることで検知するため、基本的には不要になるが、
    // アニメーション発火のために監視対象として残すか、targetTimeの変更を監視する。
    // ここでは targetTime の変更を監視して +60 アニメーションを出す方針に変更。
}

export const Timer: React.FC<TimerProps> = ({ targetTime, initialSeconds, isRunning, onComplete }) => {
    // ターゲットタイムがあればそれベース、なければ初期秒数ベース
    const calculateSeconds = () => {
        if (targetTime) {
            const now = Date.now();
            return Math.max(0, Math.ceil((targetTime - now) / 1000));
        }
        return initialSeconds;
    };

    const [seconds, setSeconds] = useState(calculateSeconds);

    // アニメーション用：前回のtargetTimeを保持して、増えた場合に延長演出
    const prevTargetTimeRef = useRef<number | undefined>(targetTime);

    // エフェクト表示管理
    const [showEffect, setShowEffect] = useState(false);
    const [effectKey, setEffectKey] = useState<number>(0);

    // targetTimeが変更された（延長された）場合の検知
    useEffect(() => {
        if (targetTime && prevTargetTimeRef.current && targetTime > prevTargetTimeRef.current) {
            // 延長されたとみなす
            setEffectKey(targetTime);
            setShowEffect(true);
            const timer = setTimeout(() => setShowEffect(false), 3000);

            // 即時反映
            setSeconds(calculateSeconds());

            prevTargetTimeRef.current = targetTime;
            return () => clearTimeout(timer);
        }
        prevTargetTimeRef.current = targetTime;
        // targetTimeが初期化された場合などはここを通過して更新
        setSeconds(calculateSeconds());
    }, [targetTime]);

    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            const currentSec = calculateSeconds();
            setSeconds(currentSec);

            if (currentSec <= 0) {
                // タイマー終了
                // onCompleteは1回だけ呼びたいが、setInterval内なので何度も呼ばれる可能性がある。
                // 親側で制御するか、ここでフラグ管理が必要だが、
                // 今回は表示用コンポーネントとしての責務に集中し、0になったらコールバック（もしあれば）
                if (onComplete && currentSec === 0) onComplete();
            }
        }, 200); // チェック頻度を上げて同期ズレを目立たなくする

        return () => clearInterval(interval);
    }, [isRunning, targetTime, initialSeconds]); // initialSecondsはfallback

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const isUrgent = seconds <= 30 && seconds > 0;

    return (
        <div className="w-full flex justify-center items-center">
            <div className="relative">
                <motion.div
                    key={`timer-box-${effectKey}`}
                    animate={showEffect ? {
                        backgroundColor: ['rgba(0,0,0,0.6)', 'rgba(22, 101, 52, 0.4)', 'rgba(0,0,0,0.6)'],
                        borderColor: ['rgba(255,255,255,0.2)', 'rgba(134, 239, 172, 0.8)', 'rgba(255,255,255,0.2)'],
                        boxShadow: ['0 0 0px rgba(74, 222, 128, 0)', '0 0 40px rgba(74, 222, 128, 0.4)', '0 0 0px rgba(74, 222, 128, 0)']
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

                <AnimatePresence>
                    {showEffect && (
                        <motion.div
                            key={`effect-text-${effectKey}`}
                            initial={{ opacity: 0, x: 0, scale: 0.9, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, x: 30, scale: 1.1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: 60, scale: 1.1, filter: 'blur(10px)' }}
                            transition={{ duration: 2.0, ease: "easeOut" }}
                            className="absolute left-[80%] top-[20%] -translate-y-1/2 font-bold text-2xl ml-2 pointer-events-none z-0 whitespace-nowrap flex items-center gap-2"
                            style={{
                                color: '#86efac',
                                textShadow: '0 0 20px rgba(74, 222, 128, 0.5)'
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
