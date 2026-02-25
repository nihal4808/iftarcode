"use client";

import { motion } from "framer-motion";

interface CrescentMoonProps {
    size?: number;
    className?: string;
}

export default function CrescentMoon({ size = 120, className = "" }: CrescentMoonProps) {
    return (
        <motion.div
            className={`relative ${className}`}
            animate={{
                y: [0, -15, 0],
                rotate: [0, 3, -3, 0],
            }}
            transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        >
            {/* Glow backdrop */}
            <div
                className="absolute inset-0 rounded-full blur-3xl"
                style={{
                    background: "radial-gradient(circle, rgba(250,204,21,0.15) 0%, transparent 70%)",
                    transform: "scale(2)",
                }}
            />

            {/* Crescent Moon SVG */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10"
            >
                <defs>
                    <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#facc15" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="moonGradient" x1="20" y1="10" x2="80" y2="90">
                        <stop offset="0%" stopColor="#fde68a" />
                        <stop offset="50%" stopColor="#facc15" />
                        <stop offset="100%" stopColor="#eab308" />
                    </linearGradient>
                </defs>

                {/* Outer glow */}
                <circle cx="50" cy="50" r="48" fill="url(#moonGlow)" />

                {/* Crescent shape */}
                <path
                    d="M 50 5 
             A 45 45 0 1 1 50 95 
             A 32 32 0 1 0 50 5 Z"
                    fill="url(#moonGradient)"
                    filter="drop-shadow(0 0 10px rgba(250,204,21,0.5))"
                />

                {/* Stars */}
                <motion.circle
                    cx="75" cy="25" r="1.5"
                    fill="#fde68a"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                />
                <motion.circle
                    cx="82" cy="40" r="1"
                    fill="#fde68a"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                />
                <motion.circle
                    cx="70" cy="15" r="0.8"
                    fill="#fde68a"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: 1 }}
                />
            </svg>
        </motion.div>
    );
}
