
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where } from 'firebase/firestore';
import { ChatMessage } from '../../types/game';
import { motion } from 'framer-motion';

interface ChatSystemProps {
    roomId: string;
    topicId: string | null; // 現在の選択トピックID (nullなら全体チャット)
    playerName: string;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({ roomId, topicId, playerName }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // メッセージの監視 (Subcollection: rooms/{roomId}/messages)
    useEffect(() => {
        const messagesRef = collection(db, 'rooms', roomId, 'messages');

        // 複合インデックスが必要になる可能性があるため、まずは単純に時系列で取得し、
        // クライアントサイドでフィルタリングを行う方式に変更して確実に表示させる。
        const q = query(
            messagesRef,
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: ChatMessage[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                msgs.push({
                    id: doc.id,
                    topicId: data.topicId,
                    text: data.text,
                    authorName: data.authorName,
                    createdAt: data.createdAt?.toMillis() || Date.now(),
                });
            });

            // クライアントサイドフィルタリング
            const filteredMsgs = msgs.filter(msg => {
                if (topicId) {
                    return msg.topicId === topicId;
                } else {
                    // 全体チャット（topicIdがないもの）
                    return !msg.topicId;
                }
            });

            setMessages(filteredMsgs);
        });

        return () => unsubscribe();
    }, [roomId, topicId]);

    // 自動スクロール
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        try {
            await addDoc(collection(db, 'rooms', roomId, 'messages'), {
                topicId: topicId, // null or topicId
                text: inputText.trim(),
                authorName: playerName,
                createdAt: serverTimestamp(),
            });
            setInputText('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl">
            {/* Header */}
            <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
                <span className="font-bold text-gray-200 text-sm">
                    {topicId ? '💬 議論チャット' : '💬 ロビーチャット'}
                </span>
                <span className="text-xs text-gray-400">{messages.length} 件</span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mt-4">
                        メッセージはまだありません。挨拶してみましょう！👋
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.authorName === playerName;
                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                ? 'bg-indigo-600/80 text-white rounded-br-none'
                                : 'bg-gray-700/80 text-gray-100 rounded-bl-none'
                                }`}>
                                {msg.text}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                                {isMe ? 'あなた' : msg.authorName}
                            </span>
                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white/5 border-t border-white/10 flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="メッセージを入力..."
                    className="flex-1 bg-black/20 border border-gray-600 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition"
                >
                    ➤
                </button>
            </form>
        </div>
    );
};
