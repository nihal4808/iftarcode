"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Participant {
    id: string;
    name: string;
    joinedAt: number;
}

interface ParticipantListProps {
    participants: Participant[];
    hostName: string;
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

const AVATAR_COLORS = [
    "from-purple-accent to-purple-dark",
    "from-blue-500 to-blue-700",
    "from-emerald-500 to-emerald-700",
    "from-amber-500 to-amber-700",
    "from-rose-500 to-rose-700",
    "from-cyan-500 to-cyan-700",
    "from-indigo-500 to-indigo-700",
    "from-pink-500 to-pink-700",
];

function getAvatarColor(index: number) {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export default function ParticipantList({ participants, hostName }: ParticipantListProps) {
    return (
        <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    Participants
                </h3>
                <span className="text-xs text-slate-500 bg-navy/40 px-2.5 py-1 rounded-full">
                    {participants.length}
                </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                <AnimatePresence initial={false}>
                    {participants.map((p, index) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            {/* Avatar */}
                            <div
                                className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(index)} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                            >
                                {getInitials(p.name)}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">
                                    {p.name}
                                    {p.name === hostName && (
                                        <span className="ml-2 text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded-full font-medium">
                                            HOST
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Online indicator */}
                            <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
