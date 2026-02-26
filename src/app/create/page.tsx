"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import CrescentMoon from "@/components/CrescentMoon";
import { cities } from "@/lib/cities";

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

export default function CreateRoomPage() {
    const router = useRouter();
    const [hostName, setHostName] = useState("");
    const [city, setCity] = useState("Kozhikode"); // Default to a prominent Kerala city
    const [searchQuery, setSearchQuery] = useState("Kozhikode");
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const filteredCities = cities.filter(
        (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.country.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hostName.trim() || !city) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hostName: hostName.trim(), city }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to create room");
                setLoading(false);
                return;
            }

            // Store name in sessionStorage for the room page
            sessionStorage.setItem("userName", hostName.trim());
            router.push(`/room/${data.code}`);
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="gradient-bg min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background orbs */}
            <div className="absolute top-20 right-20 w-72 h-72 bg-purple-accent/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-20 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 w-full max-w-lg"
            >
                {/* Back button */}
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

                {/* Card */}
                <motion.div variants={itemVariants} className="glass rounded-3xl p-8 md:p-10">
                    <div className="flex items-center gap-4 mb-8">
                        <CrescentMoon size={50} />
                        <div>
                            <h1 className="text-2xl font-bold text-white">Create a Room</h1>
                            <p className="text-slate-400 text-sm mt-1">
                                Set up your Iftar gathering
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Host Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={hostName}
                                onChange={(e) => setHostName(e.target.value)}
                                placeholder="Enter your name"
                                className="input-glow w-full bg-navy/60 border border-purple-accent/20 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 transition-all"
                                maxLength={30}
                                required
                            />
                        </div>

                        {/* City */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                City
                            </label>
                            <input
                                type="text"
                                value={showDropdown ? searchQuery : city}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowDropdown(true);
                                    if (!e.target.value) setCity("");
                                }}
                                onFocus={() => {
                                    setShowDropdown(true);
                                    setSearchQuery(city);
                                }}
                                placeholder="Search for your city..."
                                className="input-glow w-full bg-navy/60 border border-purple-accent/20 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 transition-all"
                                required
                            />

                            {showDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute z-50 w-full mt-2 glass rounded-xl max-h-60 overflow-y-auto shadow-2xl"
                                >
                                    {filteredCities.length === 0 ? (
                                        <div className="px-4 py-3 text-slate-500 text-sm">
                                            No cities found
                                        </div>
                                    ) : (
                                        filteredCities.map((c) => (
                                            <button
                                                key={`${c.name}-${c.countryCode}`}
                                                type="button"
                                                onClick={() => {
                                                    setCity(c.name);
                                                    setSearchQuery(c.name);
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-purple-accent/10 transition-colors flex items-center justify-between cursor-pointer"
                                            >
                                                <span className="text-white text-sm">{c.name}</span>
                                                <span className="text-slate-500 text-xs">{c.country}</span>
                                            </button>
                                        ))
                                    )}
                                </motion.div>
                            )}
                        </div>

                        {/* Click outside to close dropdown */}
                        {showDropdown && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowDropdown(false)}
                            />
                        )}

                        {/* Error */}
                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-2"
                            >
                                {error}
                            </motion.p>
                        )}

                        {/* Submit */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={!hostName.trim() || !city || loading}
                            className="btn-glow w-full py-4 bg-gradient-to-r from-purple-accent to-purple-dark text-white font-semibold rounded-xl text-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-purple-accent/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                />
                            ) : (
                                <>
                                    Create Room
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
