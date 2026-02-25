"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface CelebrationOverlayProps {
    show: boolean;
    onDismiss: () => void;
}

export default function CelebrationOverlay({ show, onDismiss }: CelebrationOverlayProps) {
    const fireConfetti = useCallback(() => {
        const duration = 6000;
        const end = Date.now() + duration;

        const colors = ["#facc15", "#7c3aed", "#a78bfa", "#fde68a", "#ffffff"];

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.7 },
                colors,
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.7 },
                colors,
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };

        // Initial burst
        confetti({
            particleCount: 100,
            spread: 100,
            origin: { y: 0.5 },
            colors,
        });

        frame();
    }, []);

    useEffect(() => {
        if (show) {
            fireConfetti();
            const timer = setTimeout(() => {
                onDismiss();
            }, 12000);
            return () => clearTimeout(timer);
        }
    }, [show, fireConfetti, onDismiss]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    onClick={onDismiss}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-navy/80 backdrop-blur-md" />

                    {/* Content */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                            delay: 0.2,
                        }}
                        className="relative z-10 text-center px-8"
                    >
                        {/* Crescent */}
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="text-8xl mb-6"
                        >
                            🌙
                        </motion.div>

                        {/* Main text */}
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="text-5xl md:text-7xl font-extrabold mb-4 animate-celebration"
                        >
                            <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                                IFTAR
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-purple-light via-white to-purple-light bg-clip-text text-transparent">
                                MUBARAK
                            </span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                            className="text-slate-400 text-lg md:text-xl mt-4"
                        >
                            May your fast be accepted ✨
                        </motion.p>

                        {/* Dismiss hint */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2 }}
                            className="text-slate-600 text-sm mt-8"
                        >
                            Tap anywhere to continue
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
