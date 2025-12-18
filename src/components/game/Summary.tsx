import React, { useState, useEffect } from 'react';
import { Room, ChatMessage } from '../../types/game';
import { updateDoc, doc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';

interface SummaryProps {
    room: Room;
    isHost: boolean;
}

export const Summary: React.FC<SummaryProps> = ({ room, isHost }) => {
    const navigate = useNavigate();
    const [generatedText, setGeneratedText] = useState<string>('');

    useEffect(() => {
        const generateSummary = async () => {
            const title = `News Unpacked - Session ${room.id}\nDate: ${new Date(room.createdAt).toLocaleDateString()}\n\n`;
            const members = `Participants: ${room.players.map(p => p.name).join(', ')}\n\n`;

            let summaryContent = '';

            // チャットログの取得
            const messagesRef = collection(db, 'rooms', room.id, 'messages');
            const q = query(messagesRef, orderBy('createdAt', 'asc'));
            const snapshot = await getDocs(q);
            const messages = snapshot.docs.map(doc => doc.data() as ChatMessage);

            room.topics.forEach((topic, index) => {
                summaryContent += `----------------------------------------\n`;
                const author = room.players.find(p => p.id === topic.authorId);
                summaryContent += `Topic #${index + 1}: ${topic.originalText}\n`;
                summaryContent += `Created by: ${author?.name || 'Unknown'}\n`;
                summaryContent += `Status: ${topic.isRevealed ? '[Discussed]' : '[Skipped]'}\n`;
                summaryContent += `----------------------------------------\n\n`;

                // このトピックに関連するチャットメッセージをフィルタリング
                const topicMessages = messages.filter(m => m.topicId === topic.id);

                if (topicMessages.length > 0) {
                    summaryContent += `[Discussion Log]\n`;
                    topicMessages.forEach(msg => {
                        const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        summaryContent += `[${time}] ${msg.authorName}: ${msg.text}\n`;
                    });
                } else {
                    summaryContent += `(No chat logs for this topic)\n`;
                }
                summaryContent += `\n`;
            });

            // 全体チャット（ロビーチャットなどでtopicIdがないもの）
            const generalMessages = messages.filter(m => !m.topicId);
            if (generalMessages.length > 0) {
                summaryContent += `----------------------------------------\n`;
                summaryContent += `General Chat / Lobby\n`;
                summaryContent += `----------------------------------------\n`;
                generalMessages.forEach(msg => {
                    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    summaryContent += `[${time}] ${msg.authorName}: ${msg.text}\n`;
                });
            }

            setGeneratedText(title + members + summaryContent);
        };

        generateSummary();
    }, [room]);

    // クリップボードにコピー
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedText);
            alert("クリップボードにコピーしました！");
        } catch (e) {
            alert("コピーに失敗しました");
        }
    };

    // テキストファイルとしてダウンロード
    const handleDownload = () => {
        const blob = new Blob([generatedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `news-unpacked-${room.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ゲームのリセット（最初から遊ぶ）
    const handleReset = async () => {
        if (!isHost) return;
        // ルームの状態をロビーに戻します
        // プレイヤーは保持しますが、トピックはクリアします
        await updateDoc(doc(db, 'rooms', room.id), {
            status: 'lobby',
            topics: [],
            currentTopicId: null,
            latestReaction: null,
            strokes: [] // キャンバスもクリア
        });
    };

    // 部屋から退出する
    const handleLeave = () => {
        navigate('/');
    };

    return (
        <div className="min-h-[calc(100vh-2rem)] flex items-center justify-center relative overflow-hidden rounded-2xl">
            <div className="glass-panel rounded-3xl p-8 shadow-2xl max-w-3xl w-full relative z-10 border-t border-white/30">
                <div className="text-center mb-8">
                    <span className="text-6xl mb-4 block">🎉</span>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">お疲れ様でした！</h2>
                    <p className="text-indigo-200">議論の記録が作成されました</p>
                </div>

                <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl font-mono text-sm overflow-auto max-h-80 mb-8 whitespace-pre-wrap text-emerald-300 border border-white/5 shadow-inner custom-scrollbar">
                    {generatedText || "サマリーを作成中..."}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={handleCopy}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <span className="text-xl">📋</span>
                        <span>コピー</span>
                    </button>
                    <button
                        onClick={handleDownload}
                        className="bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-xl font-bold shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">💾</span>
                        <span>保存(.txt)</span>
                    </button>
                </div>

                <div className="border-t border-white/10 pt-6 flex justify-center">
                    <button
                        onClick={handleLeave}
                        className="text-gray-400 hover:text-white px-6 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm"
                    >
                        退出する
                    </button>

                    {isHost && (
                        <button
                            onClick={handleReset}
                            className="ml-4 text-red-300 hover:text-red-100 px-6 py-2 rounded-lg hover:bg-red-900/30 transition-colors text-sm"
                        >
                            最初から遊ぶ
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
