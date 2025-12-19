import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CyberBackground } from '../components/ui/CyberBackground';

// ウェルカム画面（トップページ）コンポーネント
export const Welcome: React.FC = () => {
    // ユーザー名とルームIDの入力状態管理
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const navigate = useNavigate();

    // ローディングとエラー状態
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLaunching, setIsLaunching] = useState(false);

    // 新しいルームを作成するハンドラ
    const handleCreateRoom = async () => {
        if (!username) return;
        setIsLoading(true);
        setError('');
        try {
            // roomServiceを動的にインポート（初期ロード軽量化のため）
            const { createRoom } = await import('../services/roomService');
            const { roomId, player } = await createRoom(username);

            // プレイヤー情報とルームIDをローカルストレージに保存
            // これによりリロードしても再接続が可能になります
            localStorage.setItem('neun_player', JSON.stringify(player));
            localStorage.setItem('neun_roomId', roomId);

            navigate(`/room/${roomId}`);
        } catch (e: any) {
            console.error(e);
            setError('Failed to create room. check console.');
        } finally {
            setIsLoading(false);
        }
    };

    // 既存のルームに参加するハンドラ
    const handleJoinRoom = async () => {
        if (!username || !roomId) return;
        setIsLoading(true);
        setError('');
        try {
            const { joinRoom } = await import('../services/roomService');
            const { player } = await joinRoom(roomId.toUpperCase(), username);

            localStorage.setItem('neun_player', JSON.stringify(player));
            localStorage.setItem('neun_roomId', roomId.toUpperCase());

            navigate(`/room/${roomId.toUpperCase()}`);
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to join room');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden text-white">
            <CyberBackground />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="glass-panel w-full max-w-md p-8 md:p-10 rounded-3xl relative z-10 border border-white/10 shadow-2xl backdrop-blur-xl"
            >
                <div className="text-center mb-10 relative">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2 relative inline-block">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x drop-shadow-lg">
                                News Unpacked
                            </span>


                            <motion.span
                                animate={isLaunching ? {
                                    // x,y: 配列にするとキーフレームアニメーションになります。
                                    // 最初〜最後までの値を細かく指定して「震え」を作っています。
                                    // [0, -20, 20, ...] : 0から始まって、左(-20)・右(20)に交互に動く
                                    // 最後の値(1500, -1500)が「発射して飛んでいく位置」です。
                                    x: [0, -20, 20, -30, 30, -20, 20, -30, 30, -20, 20, -10, 10, 0, 1500],
                                    y: [0, -20, 20, -30, 30, -20, 20, -30, 30, -20, 20, -10, 10, 0, -1500],

                                    // rotate: 回転。現在はすべて0（回転なし）にしています。
                                    rotate: Array(15).fill(0),

                                    // scale: 大きさ。現在はほぼ1ですが、最後だけ0（消える）にしています。
                                    scale: [...Array(14).fill(1), 0],
                                    // opacity: 透明度。最後だけ0（透明）にして消します。
                                    opacity: [...Array(14).fill(1), 0]
                                } : {
                                    // 通常時のゆらゆらアニメーション
                                    rotate: [0, 10, -10, 0],
                                    y: 0
                                }}
                                transition={isLaunching ? {
                                    duration: 4.0, // 全体のアニメーション時間（秒）

                                    // times: 各キーフレームのタイミング（0〜1の割合）
                                    // 0.5（全体の50% = 2秒地点）まで震えて、そこから発射します。
                                    // この数値をいじると「震える時間」と「飛んでいく時間」の配分が変わります。
                                    times: [0, 0.04, 0.08, 0.12, 0.16, 0.20, 0.24, 0.28, 0.32, 0.36, 0.40, 0.44, 0.48, 0.5, 1],

                                    ease: "easeIn" // 加速しながら動く
                                } : {
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 3
                                }}
                                onClick={() => setIsLaunching(true)}
                                className="absolute -top-6 -right-8 text-4xl cursor-pointer hover:scale-125 transition-transform"
                                style={{ display: 'inline-block' }} // Transform requires block/inline-block
                            >
                                🚀
                            </motion.span>
                        </h1>
                        <p className="text-indigo-200/80 text-sm tracking-[0.2em] font-medium uppercase mt-2">
                            Online Discovery & Discussion Tool
                        </p>
                    </motion.div>
                </div>

                <div className="flex flex-col gap-5">
                    {/* Error Message Display */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm text-center font-medium"
                        >
                            {error}
                        </motion.div>
                    )}

                    <div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-field bg-white/5 border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            placeholder="名前を入力"
                        />
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2"></div>

                    <div className="flex flex-col gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCreateRoom}
                            disabled={!username || isLoading}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500
                                     disabled:opacity-60 disabled:cursor-not-allowed rounded-xl font-bold text-lg shadow-xl shadow-indigo-900/40 text-white relative overflow-hidden group"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        <span>新しい部屋を作る</span>
                                    </>
                                )}
                            </span>
                        </motion.button>

                        <div className="relative text-center">
                            <span className="text-xs text-gray-500 uppercase tracking-widest bg-transparent px-2">または部屋に参加</span>
                        </div>

                        <div className="relative flex items-center group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-gray-500 group-focus-within:text-indigo-400 transition-colors font-bold">#</span>
                            </div>
                            <input
                                type="text"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                className="input-field !pl-8 pr-28 bg-white/5 border-white/10 rounded-xl py-4"
                                placeholder="Room ID"
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleJoinRoom}
                                disabled={!username || !roomId || isLoading}
                                className="absolute right-2 top-2 bottom-2 px-6 bg-white/10 hover:bg-emerald-500/80 hover:text-white
                                         disabled:opacity-30 rounded-lg font-bold text-sm transition-all text-gray-300"
                            >
                                参加
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 text-white/40 text-xs font-mono tracking-widest"
            >
                v1.0.0 • DESIGNED FOR DISCOVERY
            </motion.div>
        </div>
    );
};
