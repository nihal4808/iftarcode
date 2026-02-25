"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface CountdownTimerProps {
    maghribTime: string; // "HH:MM" format
    onComplete: () => void;
}

export default function CountdownTimer({ maghribTime, onComplete }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [initialTotalSeconds, setInitialTotalSeconds] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const calculateTimeLeft = useCallback(() => {
        const now = new Date();
        const [hours, minutes] = maghribTime.split(":").map(Number);
        const target = new Date();
        target.setHours(hours, minutes, 0, 0);

        // If target time has passed, countdown is done
        if (target.getTime() <= now.getTime()) {
            return { hours: 0, minutes: 0, seconds: 0, total: 0 };
        }

        const diff = Math.floor((target.getTime() - now.getTime()) / 1000);
        return {
            hours: Math.floor(diff / 3600),
            minutes: Math.floor((diff % 3600) / 60),
            seconds: diff % 60,
            total: diff,
        };
    }, [maghribTime]);

    useEffect(() => {
        const initial = calculateTimeLeft();
        setInitialTotalSeconds(initial.total || 1);
        setTotalSeconds(initial.total);
        setTimeLeft({ hours: initial.hours, minutes: initial.minutes, seconds: initial.seconds });

        if (initial.total <= 0) {
            setIsComplete(true);
            onComplete();
            return;
        }

        const interval = setInterval(() => {
            const result = calculateTimeLeft();
            setTotalSeconds(result.total);
            setTimeLeft({ hours: result.hours, minutes: result.minutes, seconds: result.seconds });

            if (result.total <= 0 && !isComplete) {
                setIsComplete(true);
                onComplete();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [maghribTime, calculateTimeLeft, onComplete, isComplete]);

    const progress = initialTotalSeconds > 0 ? 1 - totalSeconds / initialTotalSeconds : 1;
    const circumference = 2 * Math.PI * 140;
    const strokeDashoffset = circumference * (1 - progress);

    const pad = (n: number) => String(n).padStart(2, "0");

    if (isComplete) {
        return (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
            >
                <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 300 300">
                        <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(250,204,21,0.1)" strokeWidth="4" />
                        <circle
                            cx="150" cy="150" r="140" fill="none"
                            stroke="url(#goldGradient)" strokeWidth="4"
                            strokeDasharray={circumference}
                            strokeDashoffset={0}
                            strokeLinecap="round"
                        />
                        <defs>
                            <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#facc15" />
                                <stop offset="100%" stopColor="#f59e0b" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="text-center">
                        <motion.p
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-gold text-3xl md:text-4xl font-bold glow-gold-text"
                        >
                            It&apos;s Time!
                        </motion.p>
                        <p className="text-slate-400 text-sm mt-2">Iftar Mubarak 🌙</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center countdown-ring">
                {/* SVG Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 300 300">
                    {/* Background ring */}
                    <circle
                        cx="150" cy="150" r="140"
                        fill="none"
                        stroke="rgba(124,58,237,0.1)"
                        strokeWidth="4"
                    />
                    {/* Progress ring */}
                    <motion.circle
                        cx="150" cy="150" r="140"
                        fill="none"
                        stroke="url(#progressGradient)"
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        initial={false}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "linear" }}
                    />
                    {/* Glow circle at progress point */}
                    <defs>
                        <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="50%" stopColor="#a78bfa" />
                            <stop offset="100%" stopColor="#facc15" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Inner glow */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-accent/5 to-transparent" />

                {/* Time display */}
                <div className="text-center relative z-10">
                    <div className="flex items-baseline justify-center gap-1">
                        <TimeUnit value={pad(timeLeft.hours)} label="hrs" />
                        <span className="text-purple-light/50 text-3xl font-light mx-1 animate-pulse">:</span>
                        <TimeUnit value={pad(timeLeft.minutes)} label="min" />
                        <span className="text-purple-light/50 text-3xl font-light mx-1 animate-pulse">:</span>
                        <TimeUnit value={pad(timeLeft.seconds)} label="sec" />
                    </div>
                    <p className="text-slate-500 text-xs mt-4 tracking-widest uppercase">
                        until Maghrib
                    </p>
                </div>
            </div>

            {/* Maghrib time display */}
            <p className="mt-4 text-slate-500 text-sm">
                Maghrib at <span className="text-purple-light font-medium">{maghribTime}</span>
            </p>
        </div>
    );
}

function TimeUnit({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <motion.span
                key={value}
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl md:text-5xl font-bold text-white tabular-nums font-mono tracking-wider"
            >
                {value}
            </motion.span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{label}</span>
        </div>
    );
}
