"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import CrescentMoon from "@/components/CrescentMoon";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function JoinRoomForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [name, setName] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const code = searchParams.get("code");
        if (code) setRoomCode(code.toUpperCase());
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || roomCode.length !== 6) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/rooms/${roomCode.toUpperCase()}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to join room");
                setLoading(false);
                return;
            }

            sessionStorage.setItem("userName", name.trim());
            router.push(`/room/${roomCode.toUpperCase()}`);
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="gradient-bg min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-accent/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 w-full max-w-lg"
            >
                <motion.button
                    variants={itemVariants}
                    whileHover={{ x: -3 }}
                    onClick={() => router.push("/")}
                    className="mb-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to home
                </motion.button>

                <motion.div variants={itemVariants} className="glass rounded-3xl p-8 md:p-10">
                    <div className="flex items-center gap-4 mb-8">
                        <CrescentMoon size={50} />
                        <div>
                            <h1 className="text-2xl font-bold text-white">Join a Room</h1>
                            <p className="text-slate-400 text-sm mt-1">
                                Enter the code shared by your host
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                className="input-glow w-full bg-navy/60 border border-purple-accent/20 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 transition-all"
                                maxLength={30}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Room Code
                            </label>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) =>
                                    setRoomCode(
                                        e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
                                    )
                                }
                                placeholder="XXXXXX"
                                className="input-glow w-full bg-navy/60 border border-purple-accent/20 rounded-xl px-4 py-3.5 text-white text-center font-mono text-2xl tracking-[0.4em] placeholder:text-slate-500 placeholder:tracking-[0.4em] transition-all"
                                maxLength={6}
                                required
                            />
                            <p className="text-slate-500 text-xs mt-2 text-center">
                                6-character code (letters & numbers)
                            </p>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-2"
                            >
                                {error}
                            </motion.p>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={!name.trim() || roomCode.length !== 6 || loading}
                            className="btn-glow w-full py-4 bg-gradient-to-r from-gold to-yellow-500 text-navy font-bold rounded-xl text-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-navy/30 border-t-navy rounded-full"
                                />
                            ) : (
                                <>
                                    Join Room
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default function JoinRoomPage() {
    return (
        <Suspense
            fallback={
                <div className="gradient-bg min-h-screen flex items-center justify-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-2 border-purple-accent/30 border-t-purple-accent rounded-full"
                    />
                </div>
            }
        >
            <JoinRoomForm />
        </Suspense>
    );
}
