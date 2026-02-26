"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import CrescentMoon from "@/components/CrescentMoon";
import RamadanChandelier from "@/components/RamadanChandelier";
import KeralaSilhouettes from "@/components/KeralaSilhouettes";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export default function LandingPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleJoin = () => {
    if (roomCode.trim().length === 6) {
      router.push(`/join?code=${roomCode.toUpperCase()}`);
    }
  };

  return (
    <div className="gradient-bg min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Decorative Background Elements */}
      <KeralaSilhouettes />
      <RamadanChandelier side="left" />
      <RamadanChandelier side="right" />

      {/* Minnaminungi (Fireflies) */}
      {Array.from({ length: 35 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[1px]"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: `rgba(245, 158, 11, ${Math.random() * 0.6 + 0.2})`, // Amber/Gold glow
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -Math.random() * 50 - 20, Math.random() * 20],
            x: [0, Math.random() * 30 - 15, Math.random() * 30 - 15],
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 4 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center text-center max-w-2xl"
      >
        {/* Crescent Moon */}
        <motion.div variants={itemVariants} className="mb-8">
          <CrescentMoon size={140} />
        </motion.div>

        {/* Logo / Title */}
        <motion.h1
          variants={itemVariants}
          className="text-6xl md:text-7xl font-extrabold tracking-tight mb-3"
        >
          <span className="bg-gradient-to-r from-purple-light via-purple-accent to-gold bg-clip-text text-transparent">
            Iftar
          </span>
          <span className="text-white">Code</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-slate-400 font-light mb-12 max-w-md"
        >
          Break Your Fast Together.{" "}
          <span className="text-gold font-medium">Anywhere.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/create")}
            className="btn-glow flex-1 px-8 py-4 bg-gradient-to-r from-purple-accent to-purple-dark text-white font-semibold rounded-2xl text-lg shadow-lg shadow-purple-accent/20 cursor-pointer"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Room
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowJoinInput(!showJoinInput)}
            className="btn-glow flex-1 px-8 py-4 bg-surface border border-purple-accent/20 text-white font-semibold rounded-2xl text-lg cursor-pointer hover:border-purple-accent/40 transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
              </svg>
              Join Room
            </span>
          </motion.button>
        </motion.div>

        {/* Join Room Input */}
        <motion.div
          initial={false}
          animate={{
            height: showJoinInput ? "auto" : 0,
            opacity: showJoinInput ? 1 : 0,
            marginTop: showJoinInput ? 24 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden w-full max-w-md"
        >
          <div className="glass rounded-2xl p-4 flex gap-3">
            <input
              type="text"
              placeholder="Enter 6-digit room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="input-glow flex-1 bg-navy/60 border border-purple-accent/20 rounded-xl px-4 py-3 text-white text-center font-mono text-xl tracking-[0.3em] placeholder:text-slate-500 placeholder:tracking-normal placeholder:text-base placeholder:font-sans transition-all"
              maxLength={6}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleJoin}
              disabled={roomCode.length !== 6}
              className="px-6 py-3 bg-gold text-navy font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all hover:shadow-lg hover:shadow-gold/20"
            >
              Go →
            </motion.button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          variants={itemVariants}
          className="mt-16 text-sm text-slate-500"
        >
          No sign-up required · Rooms expire after 6 hours
        </motion.p>
      </motion.div>
    </div>
  );
}
