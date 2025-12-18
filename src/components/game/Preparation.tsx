import React, { useState } from 'react';
import { Room, Topic, MaskToken } from '../../types/game';
import { addTopic } from '../../services/roomService';
import { getRandomTopic } from '../../data/gachaTopics';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface PreparationProps {
    room: Room;
    currentPlayerId: string;
}

export const Preparation: React.FC<PreparationProps> = ({ room, currentPlayerId }) => {
    // ユーザー毎の提出トピック数の上限を取得（デフォルト3）
    const maxTopics = room.settings?.maxTopicsPerPlayer || 3;

    // 入力データの配列管理
    // maxTopics分の空文字で初期化します。
    // State: inputs: string[] (入力されたテキスト)
    const [inputs, setInputs] = useState<string[]>(Array(maxTopics).fill(''));

    // 伏せ字（マスク）の状態管理
    // 各トピックのインデックスをキーとし、MaskToken配列を値として保持します。
    // Map<入力欄のindex, MaskToken[]>
    const [masks, setMasks] = useState<{ [index: number]: MaskToken[] }>({});

    const [isSubmitting, setIsSubmitting] = useState(false);

    // このプレイヤーが既にお題を提出済みかどうか判定
    const isSubmitted = room.topics.some(t => t.authorId === currentPlayerId);

    // ホスト用：議論フェーズへの遷移ハンドラ
    // 変更点: 確認ダイアログを削除し、全員完了時のみ押せるUIにします。
    const handleStartDiscussion = async () => {
        // お題の並び順をシャッフルする (Fisher-Yates)
        const shuffledTopics = [...room.topics];
        for (let i = shuffledTopics.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledTopics[i], shuffledTopics[j]] = [shuffledTopics[j], shuffledTopics[i]];
        }

        await updateDoc(doc(db, 'rooms', room.id), {
            status: 'selection',
            topics: shuffledTopics
        });
    };

    // 入力欄の変更ハンドラ
    const handleInputChange = (index: number, value: string) => {
        const newInputs = [...inputs];
        newInputs[index] = value;
        setInputs(newInputs);

        // テキストが変更された場合、既存のマスク設定はリセットします。
        // （テキストの長さや内容が変わるとマスク位置がずれるため）
        if (masks[index]) {
            const newMasks = { ...masks };
            delete newMasks[index];
            setMasks(newMasks);
        }
    };

    // ランダムなお題を自動入力する
    const fillRandom = (index: number) => {
        handleInputChange(index, getRandomTopic(room.settings?.gachaCategories));
    };

    // 空欄の箇所をすべてランダムなお題で埋める
    const fillAllRandom = () => {
        const newInputs = [...inputs];
        newInputs.forEach((val, i) => {
            if (!val.trim()) newInputs[i] = getRandomTopic(room.settings?.gachaCategories);
        });
        setInputs(newInputs);
    };

    // --- 伏せ字（マスキング）ロジック ---
    const [activeMaskIndex, setActiveMaskIndex] = useState<number | null>(null);

    // マスク作成モーダルを開く
    const openMaskModal = (index: number) => {
        // まだトークン化されていない場合、テキストを文字ごとのトークンに分解します
        if (!masks[index]) {
            const text = inputs[index];
            if (!text.trim()) return;
            const tokens: MaskToken[] = text.split('').map(c => ({
                id: uuidv4(),
                text: c,
                isHidden: false // 初期状態では全て表示
            }));
            setMasks(prev => ({ ...prev, [index]: tokens }));
        }
        setActiveMaskIndex(index);
    };

    // トークンの表示/非表示を切り替える（文字をクリックした時の動作）
    const toggleToken = (tokenId: string) => {
        if (activeMaskIndex === null) return;
        setMasks(prev => ({
            ...prev,
            [activeMaskIndex]: prev[activeMaskIndex].map(t =>
                t.id === tokenId ? { ...t, isHidden: !t.isHidden } : t
            )
        }));
    };

    // 全てのお題をFirestoreに送信する
    const handleSubmitAll = async () => {
        // バリデーション：空欄チェック
        if (inputs.some(s => !s.trim())) {
            toast.error("空欄のお題があります。すべて埋めてください（ランダムボタンも使えます）", { icon: '⚠️' });
            return;
        }

        setIsSubmitting(true);
        try {
            const promises = inputs.map(async (text, i) => {
                // マスク情報があればそれを使用、なければデフォルト（全表示）のトークンを生成
                let currentTokens = masks[i];
                if (!currentTokens) {
                    currentTokens = text.split('').map(c => ({
                        id: uuidv4(),
                        text: c,
                        isHidden: false
                    }));
                }

                // 伏せ字に設定された文字のインデックスリストを作成
                // Firestore保存用には軽量な number[] データ形式に変換します
                const maskIndices: number[] = [];
                if (currentTokens) {
                    currentTokens.forEach((t, index) => {
                        if (t.isHidden) maskIndices.push(index);
                    });
                }

                // Topicオブジェクトの作成
                const topic: Topic = {
                    id: uuidv4(),
                    authorId: currentPlayerId,
                    originalText: text,
                    maskIndices: maskIndices,
                    isRevealed: false
                };
                return addTopic(room.id, topic);
            });

            // 全てのお題の保存を並行実行し完了を待つ
            await Promise.all(promises);
            toast.success("提出完了！他のメンバーを待ちましょう。");
        } catch (e) {
            console.error(e);
            toast.error("エラーが発生しました。");
            setIsSubmitting(false); // エラー時のみ、再試行できるようにフラグを戻す
        }
    };

    const isHost = room.players.find(p => p.id === currentPlayerId)?.isHost;

    // Count how many people submitted
    const uniqueAuthors = new Set(room.topics.map(t => t.authorId)).size;
    const totalPlayers = room.players.length;
    // 全員提出済みかどうか
    const allSubmitted = uniqueAuthors === totalPlayers;

    if (isSubmitted) {
        return (
            <div className="w-full max-w-2xl mx-auto p-6 text-center text-white">
                <h2 className="text-3xl font-bold mb-6">準備完了！</h2>
                <div className="flex flex-col items-center gap-4 mb-8">
                    <p className="text-xl">他のメンバーを待っています...</p>
                    <div className="text-4xl font-mono font-bold bg-white/10 px-6 py-3 rounded-lg backdrop-blur-sm border border-white/20">
                        <span className={allSubmitted ? "text-green-400" : "text-yellow-400"}>
                            {uniqueAuthors}
                        </span>
                        <span className="text-gray-400 mx-2">/</span>
                        <span>{totalPlayers}</span>
                    </div>
                    {!allSubmitted && (
                        <div className="animate-pulse text-2xl mt-2">⏳</div>
                    )}
                </div>

                {isHost && (
                    <div className="bg-white/10 p-6 rounded-xl mt-8 transition-all duration-300">
                        <p className="mb-4 text-gray-300">
                            {allSubmitted
                                ? "全員の準備が完了しました！"
                                : "全員が提出するまで開始できません"}
                        </p>
                        <button
                            onClick={handleStartDiscussion}
                            disabled={!allSubmitted}
                            className={`
                                font-bold py-4 px-8 rounded-full shadow-lg transition transform
                                ${allSubmitted
                                    ? "bg-red-600 hover:bg-red-500 hover:scale-105 text-white cursor-pointer"
                                    : "bg-gray-600 text-gray-400 cursor-not-allowed grayscale"}
                            `}
                        >
                            議論ボードへ進む
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-6 text-white pb-10">
            <h2 className="text-3xl font-bold mb-2 text-center">お題の準備</h2>

            <p className="text-gray-300 text-center mb-8">お題を入力し、隠したい文字をクリックして伏せ字を作ってください。</p>

            <div className="space-y-6">
                {inputs.map((text, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-indigo-300">Topic #{idx + 1}</span>
                            <button
                                onClick={() => fillRandom(idx)}
                                className="text-xs bg-purple-500/30 text-purple-200 px-3 py-1 rounded-full hover:bg-purple-500/50 transition border border-purple-500/30"
                            >
                                🎲 ランダム
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={text}
                                onChange={e => handleInputChange(idx, e.target.value)}
                                className="flex-1 bg-black/20 border border-gray-600 rounded px-4 py-3 text-white focus:border-indigo-500 outline-none transition"
                                placeholder={idx === 0 ? "例: テレワークは本当に効率的か？" : ""}
                            />
                            <button
                                onClick={() => openMaskModal(idx)}
                                disabled={!text.trim()}
                                className={`px-4 py-2 rounded font-bold transition whitespace-nowrap
                                    ${masks[idx]
                                        ? 'bg-green-600 text-white border border-green-500' // Has mask
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }
                                `}
                            >
                                {masks[idx] ? '伏せ字編集済' : '伏せ字を作る'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex gap-4 justify-center">
                <button
                    onClick={fillAllRandom}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 py-3 px-6 rounded-lg font-bold transition"
                >
                    全てランダムで埋める
                </button>
                <button
                    onClick={handleSubmitAll}
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-10 rounded-lg font-bold shadow-lg transition transform hover:scale-105 disabled:opacity-50"
                >
                    これでお題を提出する
                </button>
            </div>

            {/* Mask Editor Modal Overlay */}
            {activeMaskIndex !== null && masks[activeMaskIndex] && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4 text-center">伏せ字を作成</h3>
                        <p className="text-center text-gray-400 mb-8">クリックして隠したり表示したりできます。</p>

                        <div className="flex flex-wrap gap-1 justify-center text-3xl font-bold leading-relaxed mb-8 bg-black/30 p-8 rounded-xl min-h-[150px] items-center">
                            {masks[activeMaskIndex].map(t => (
                                <span
                                    key={t.id}
                                    onClick={() => toggleToken(t.id)}
                                    className={`cursor-pointer transition-all duration-200 select-none px-1 rounded mx-0.5 border ${t.isHidden
                                        ? 'bg-gray-700 text-transparent min-w-[1em] border-gray-500' // Hidden
                                        : 'hover:bg-indigo-900 bg-gray-900 border-transparent text-white' // Visible
                                        }`}
                                >
                                    {t.text}
                                </span>
                            ))}
                        </div>

                        <button
                            onClick={() => setActiveMaskIndex(null)}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition"
                        >
                            完了
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
