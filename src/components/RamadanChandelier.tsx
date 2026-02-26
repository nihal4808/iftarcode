"use client";

import { motion } from "framer-motion";

export default function RamadanChandelier({ side = "left" }: { side?: "left" | "right" }) {
    // Generate a random sway delay so left and right chandeliers swing out of sync
    const swayDelay = side === "left" ? 0 : 1.5;

    return (
        <div className={`absolute top-0 ${side === "left" ? "left-[5%] md:left-[10%]" : "right-[5%] md:right-[10%]"} pointer-events-none z-0 opacity-80 mix-blend-screen`}>
            {/* The Chain */}
            <div className="w-px h-16 md:h-32 bg-gradient-to-b from-purple-dark/80 to-gold/60 mx-auto" />

            {/* The Swaying Chandelier Container */}
            <motion.div
                initial={{ rotate: -2 }}
                animate={{ rotate: 2 }}
                transition={{
                    duration: 3 + Math.random(),
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: swayDelay
                }}
                className="relative -mt-1 origin-top flex flex-col items-center"
            >
                {/* Glowing Aura behind the Lantern */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gold/10 rounded-full blur-2xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-orange-400/20 rounded-full blur-xl" />

                {/* SVG Chandelier Design */}
                <svg
                    width="48"
                    height="80"
                    viewBox="0 0 48 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="relative drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] text-gold"
                >
                    {/* Ring at top */}
                    <circle cx="24" cy="4" r="3.5" stroke="currentColor" strokeWidth="1" />
                    <path d="M24 8 V12" stroke="currentColor" strokeWidth="1" />

                    {/* Top Dome */}
                    <path d="M14 26 C14 18, 34 18, 34 26 L40 32 H8 L14 26 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />
                    <path d="M18 16 C22 8, 26 8, 30 16" fill="none" stroke="currentColor" strokeWidth="1" />
                    <path d="M24 8 V16" stroke="currentColor" strokeWidth="1" />

                    {/* Main Body */}
                    <path d="M12 32 L16 64 H32 L36 32 Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1" />

                    {/* Structural Ribs */}
                    <path d="M24 32 V64" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
                    <path d="M16 32 C20 45, 20 51, 16 64" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
                    <path d="M32 32 C28 45, 28 51, 32 64" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />

                    {/* Window Arches inside body */}
                    <path d="M18 42 C18 36, 22 36, 22 42 V56 H18 Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="0.5" />
                    <path d="M26 42 C26 36, 30 36, 30 42 V56 H26 Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="0.5" />

                    {/* Bottom Base */}
                    <path d="M16 64 L20 72 H28 L32 64 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />

                    {/* Dangling Crescent/Star */}
                    <circle cx="24" cy="74" r="1" fill="currentColor" />
                    <path d="M24 75 V77" stroke="currentColor" strokeWidth="0.5" />
                    <path d="M24 78 A 2 2 0 1 0 24 82 A 2 2 0 0 1 24 78" fill="currentColor" />
                </svg>

                {/* Animated Candle Light inside SVG body */}
                <motion.div
                    initial={{ opacity: 0.6, scale: 0.95 }}
                    animate={{ opacity: [0.6, 1, 0.7, 1, 0.6], scale: [0.95, 1.05, 0.98, 1.02, 0.95] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[36px] left-1/2 -translate-x-1/2 w-4 h-6 bg-yellow-200/40 rounded-full blur-[2px]"
                />
            </motion.div>
        </div>
    );
}
