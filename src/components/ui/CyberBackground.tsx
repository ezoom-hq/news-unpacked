import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const CyberBackground: React.FC = () => {
    // Generate static random values for background elements to prevent re-renders
    const shapes = useMemo(() => [...Array(6)].map((_, i) => ({
        id: i,
        width: Math.random() * 300 + 50,
        height: Math.random() * 300 + 50,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 15 + Math.random() * 10,
        delay: Math.random() * 5,
        isCircle: i % 2 !== 0
    })), []);

    const beams = useMemo(() => [...Array(5)].map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 5,
        delay: Math.random() * 5,
        repeatDelay: Math.random() * 8
    })), []);

    return (
        <div className="fixed inset-0 bg-slate-950 -z-50 overflow-hidden pointer-events-none perspective-[1000px]">
            {/* Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

            {/* Floating Geometric Shapes (Glass) */}
            {shapes.map((shape) => (
                <motion.div
                    key={`shape-${shape.id}`}
                    className={`absolute border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-[1px] ${shape.isCircle ? 'rounded-full' : 'rounded-xl'}`}
                    style={{
                        width: shape.width,
                        height: shape.height,
                        left: `${shape.left}%`,
                        top: `${shape.top}%`,
                    }}
                    animate={{
                        y: [0, -40, 0],
                        rotate: [0, 360],
                        scale: [1, 1.1, 1],
                        opacity: [0.1, 0.4, 0.1],
                    }}
                    transition={{
                        duration: shape.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}

            {/* Shooting Data Beams */}
            {beams.map((beam) => (
                <motion.div
                    key={`beam-${beam.id}`}
                    className="absolute h-[1px] w-[200px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50"
                    style={{
                        top: `${beam.top}%`,
                        left: -200,
                    }}
                    animate={{
                        x: ['-20vw', '120vw'],
                    }}
                    transition={{
                        duration: beam.duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: beam.delay,
                        repeatDelay: beam.repeatDelay
                    }}
                />
            ))}
        </div>
    );
};
