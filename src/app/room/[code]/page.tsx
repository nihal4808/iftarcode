"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import CountdownTimer from "@/components/CountdownTimer";
import ChatPanel from "@/components/ChatPanel";
import ParticipantList from "@/components/ParticipantList";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import VideoChat from "@/components/VideoChat";
import DuasWidget from "@/components/DuasWidget";
import RamadanChandelier from "@/components/RamadanChandelier";

interface RoomData {
    code: string;
    hostName: string;
    city: string;
    country: string;
    maghribTime: string;
}

interface ParticipantData {
    id: string;
    name: string;
    joinedAt: number;
}

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

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const code = (params.code as string)?.toUpperCase();

    const [room, setRoom] = useState<RoomData | null>(null);
    const [participants, setParticipants] = useState<ParticipantData[]>([]);
    const [userName, setUserName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);

    const fetchRoom = useCallback(async () => {
        try {
            const res = await fetch(`/api/rooms/${code}`);
            if (!res.ok) {
                setError("Room not found or has expired");
                setLoading(false);
                return;
            }
            const data = await res.json();
            setRoom(data.room);
            setParticipants(data.participants);
            setLoading(false);
        } catch {
            setError("Failed to load room");
            setLoading(false);
        }
    }, [code]);

    useEffect(() => {
        const storedName = sessionStorage.getItem("userName");
        if (storedName) {
            setUserName(storedName);
        }
        fetchRoom();

        // Poll for participant updates
        const interval = setInterval(fetchRoom, 5000);
        return () => clearInterval(interval);
    }, [fetchRoom]);

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textArea = document.createElement("textarea");
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const copyInviteLink = async () => {
        const inviteUrl = window.location.href;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textArea = document.createElement("textarea");
            textArea.value = inviteUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCountdownComplete = useCallback(() => {
        setShowCelebration(true);
    }, []);

    if (loading) {
        return (
            <div className="gradient-bg min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-2 border-purple-accent/30 border-t-purple-accent rounded-full"
                />
            </div>
        );
    }

    if (error || !room) {
        return (
            <div className="gradient-bg min-h-screen flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-3xl p-8 text-center max-w-md"
                >
                    <p className="text-4xl mb-4">🌙</p>
                    <h2 className="text-xl font-bold text-white mb-2">Room Not Found</h2>
                    <p className="text-slate-400 mb-6">{error || "This room may have expired or doesn't exist."}</p>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => router.push("/")}
                        className="px-6 py-3 bg-purple-accent text-white rounded-xl font-medium cursor-pointer"
                    >
                        Go Home
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="gradient-bg min-h-screen relative">
            {/* Celebration Overlay */}
            <CelebrationOverlay
                show={showCelebration}
                onDismiss={() => setShowCelebration(false)}
            />

            {/* Decorative Chandeliers */}
            <RamadanChandelier side="left" />
            <RamadanChandelier side="right" />

            {/* Background particles */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-accent/3 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-3xl" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 max-w-7xl mx-auto px-4 py-4 md:py-6"
            >
                {/* Top Header Bar */}
                <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 md:mb-6">
                    {/* Room Code Badge */}
                    <div className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="glass rounded-2xl px-4 py-2.5 flex items-center gap-3 cursor-pointer"
                            onClick={copyCode}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Room</span>
                                <span className="font-mono text-lg font-bold tracking-[0.2em] text-gold glow-gold-text">
                                    {code}
                                </span>
                            </div>
                            <div className="w-px h-5 bg-purple-accent/20" />
                            <motion.span
                                key={copied ? "check" : "copy"}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-sm"
                            >
                                {copied ? (
                                    <span className="text-green-400 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied
                                    </span>
                                ) : (
                                    <span className="text-slate-400 flex items-center gap-1 hover:text-white transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy
                                    </span>
                                )}
                            </motion.span>
                        </motion.div>

                        {/* Host info */}
                        <div className="hidden sm:block text-xs text-slate-500">
                            Hosted by <span className="text-purple-light font-medium">{room.hostName}</span>
                        </div>
                    </div>

                    {/* Right side info */}
                    <div className="flex items-center gap-3">
                        {/* City badge */}
                        <div className="hidden sm:flex glass rounded-xl px-3 py-2 items-center gap-2 text-sm">
                            <span className="text-slate-500">📍</span>
                            <span className="text-slate-300">{room.city}</span>
                        </div>

                        {/* Countdown mini badge */}
                        <div className="hidden sm:flex glass rounded-xl px-3 py-2 items-center gap-2 text-sm">
                            <span className="text-gold">🌙</span>
                            <span className="text-slate-300">Maghrib: {room.maghribTime}</span>
                        </div>

                        {/* Sidebar toggle (mobile/tablet) */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="lg:hidden glass rounded-xl px-3 py-2 flex items-center gap-2 text-sm cursor-pointer"
                        >
                            <svg className="w-4 h-4 text-purple-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                            <span className="text-white font-medium">{participants.length}</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* Main Content Grid - Video Main + Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                    {/* ===== MAIN AREA: Video Chat ===== */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-8 xl:col-span-9"
                    >
                        {/* Countdown Timer - compact horizontal */}
                        <motion.div variants={itemVariants} className="mb-4">
                            <CountdownTimer
                                maghribTime={room.maghribTime}
                                onComplete={handleCountdownComplete}
                            />
                        </motion.div>

                        {/* VIDEO CHAT - Primary Section */}
                        <motion.div variants={itemVariants}>
                            <VideoChat
                                roomCode={code}
                                userName={userName || "Anonymous"}
                                participants={participants}
                            />
                        </motion.div>
                    </motion.div>

                    {/* ===== SIDEBAR: Chat + Participants + Duas ===== */}
                    <motion.div
                        variants={itemVariants}
                        className={`lg:col-span-4 xl:col-span-3 ${showSidebar ? "block" : "hidden lg:block"}`}
                    >
                        <div className="space-y-4 lg:sticky lg:top-4">
                            {/* Participants */}
                            <ParticipantList participants={participants} hostName={room.hostName} />

                            {/* Duas Widget */}
                            <DuasWidget />

                            {/* Chat - compact sidebar version */}
                            <ChatPanel roomCode={code} userName={userName || "Anonymous"} />

                            {/* Share section */}
                            <div className="glass rounded-2xl p-4">
                                <h4 className="text-sm font-semibold text-white mb-2">Invite Friends</h4>
                                <p className="text-xs text-slate-500 mb-3">
                                    Share this code or link to invite others
                                </p>
                                <div className="flex gap-2 mb-3">
                                    <div className="flex-1 bg-navy/60 rounded-xl px-3 py-2 font-mono text-sm text-center text-gold tracking-[0.3em] border border-gold/10">
                                        {code}
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={copyCode}
                                        className="px-3 py-2 bg-purple-accent/20 text-purple-light rounded-xl cursor-pointer hover:bg-purple-accent/30 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </motion.button>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={copyInviteLink}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-accent to-purple-dark text-white text-sm font-medium rounded-xl cursor-pointer shadow-lg shadow-purple-accent/20"
                                >
                                    <svg className="w-4 h-4 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                    </svg>
                                    {copied ? "Copied to clipboard!" : "Copy Invite Link"}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
