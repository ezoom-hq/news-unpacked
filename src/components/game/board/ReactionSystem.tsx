import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../services/firebase';
import { onSnapshot, doc, updateDoc } from 'firebase/firestore';

/**
 * リアクション表示コンポーネント
 * 画面上にユーザーからのリアクション（絵文字）をアニメーション表示します。
 * Firestoreの 'latestReaction' フィールドを監視し、更新があったらアニメーションを発生させます。
 * 
 * note: Firestoreの書き込み制限を考慮し、アレイへの追加ではなく「最新の1件の上書き」をトリガーにしています。
 */
export const ReactionSystem: React.FC<{ roomId: string }> = ({ roomId }) => {
    const [reactions, setReactions] = useState<{ id: string, emoji: string, x: number }[]>([]);

    // 処理済みのリアクションIDを記録（再レンダリング時の重複再生防止）
    const lastProcessedIdRef = React.useRef<string | null>(null);

    // Firestoreの変更を監視
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'rooms', roomId), (snapshot) => {
            if (!snapshot.exists()) return;
            const data = snapshot.data();

            // 最新のリアクションがあれば処理
            if (data.latestReaction) {
                const { emoji, timestamp, id } = data.latestReaction;

                // ユニークIDを使って重複排除
                const uniqueId = id || String(timestamp);

                // 既に処理済みのIDならスキップ（これが他フィールド更新時の再発火を防ぐ）
                if (lastProcessedIdRef.current === uniqueId) return;

                // 古すぎるリアクション（5秒以上前）はスキップ（初期ロード時などの誤爆防止）
                if (Date.now() - timestamp > 5000) return;

                lastProcessedIdRef.current = uniqueId;

                setReactions(prev => {
                    // 念のためState内もチェック
                    if (prev.find(r => r.id === uniqueId)) return prev;
                    // x座標の中心からのランダムオフセット（-20vw 〜 +20vw）を計算
                    return [...prev, { id: uniqueId, emoji, x: (Math.random() - 0.5) * 40 }];
                });
            }
        });
        return () => unsub();
    }, [roomId]);

    // 古いリアクションのクリーンアップ
    // 3秒経過したものをStateから削除してメモリリークを防ぐ
    useEffect(() => {
        const interval = setInterval(() => {
            setReactions(prev => prev.filter(r => Date.now() - (Number(r.id) || 0) < 3000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            <AnimatePresence>
                {reactions.map(r => (
                    <motion.div
                        key={r.id}
                        initial={{ y: '0%', opacity: 1, x: `${r.x}vw`, scale: 0.5 }}
                        animate={{ y: '-50vh', opacity: 0, scale: 1.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2.5, ease: "easeOut" }}
                        className="absolute bottom-20 left-1/2 text-6xl transform -translate-x-1/2"
                        style={{ marginLeft: `${r.x}vw` }}
                    >
                        {r.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// リアクション送信関数
// Firestoreの特定のフィールドを更新することで、全員に通知を送る
export const sendReaction = async (roomId: string, emoji: string) => {
    await updateDoc(doc(db, 'rooms', roomId), {
        latestReaction: {
            emoji,
            timestamp: Date.now(),
            id: Math.random().toString() // 強制的に変更検知させるためのランダムID
        }
    });
};
