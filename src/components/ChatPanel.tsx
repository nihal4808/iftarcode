"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

interface ChatPanelProps {
    roomCode: string;
    userName: string;
}

const EMOJI_LIST = ["❤️", "🌙", "✨", "🤲", "🕌", "🎉", "😊", "🙏", "💫", "🌟", "☪️", "🤍"];

export default function ChatPanel({ roomCode, userName }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(0);
    const isRoomActiveRef = useRef(true);

    const fetchMessages = useCallback(async () => {
        if (!isRoomActiveRef.current) return;
        try {
            const res = await fetch(`/api/rooms/${roomCode}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            } else if (res.status === 404) {
                isRoomActiveRef.current = false;
            }
        } catch {
            // Silent fail on poll
        }
    }, [roomCode]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current || prevMessagesLengthRef.current === 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages.length]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;

        setSending(true);
        const text = input.trim();
        setInput("");

        try {
            await fetch(`/api/rooms/${roomCode}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sender: userName, text }),
            });
            await fetchMessages();
        } catch {
            // Silent fail
        } finally {
            setSending(false);
        }
    };

    const handleEmojiClick = (emoji: string) => {
        setInput((prev) => prev + emoji);
        setShowEmoji(false);
    };

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="glass rounded-2xl flex flex-col h-[280px] md:h-[320px] relative">
            {/* Header */}
            <div className="px-5 py-3 border-b border-purple-accent/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-white">Live Chat</h3>
                <span className="text-xs text-slate-500 ml-auto">{messages.length} messages</span>
            </div>

            {/* Messages */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-slate-500 text-sm">No messages yet</p>
                        <p className="text-slate-600 text-xs mt-1">Be the first to say Salaam! 🌙</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => {
                            const isMe = msg.sender === userName;
                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe
                                            ? "bg-purple-accent/20 border border-purple-accent/20 rounded-br-md"
                                            : "bg-surface-light border border-white/5 rounded-bl-md"
                                            }`}
                                    >
                                        {!isMe && (
                                            <p className="text-xs font-medium text-purple-light mb-1">{msg.sender}</p>
                                        )}
                                        <p className="text-sm text-slate-200 break-words">{msg.text}</p>
                                        <p className={`text-[10px] mt-1 ${isMe ? "text-purple-light/50" : "text-slate-500"}`}>
                                            {formatTime(msg.timestamp)}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Emoji picker */}
            <AnimatePresence>
                {showEmoji && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-16 left-4 right-4 glass-light rounded-xl p-3 grid grid-cols-6 gap-2"
                    >
                        {EMOJI_LIST.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => handleEmojiClick(emoji)}
                                className="text-xl hover:scale-125 transition-transform cursor-pointer p-1 rounded-lg hover:bg-white/5"
                            >
                                {emoji}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input */}
            <div className="px-4 py-3 border-t border-purple-accent/10 flex gap-2 items-center">
                <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="p-2 text-slate-400 hover:text-gold transition-colors cursor-pointer rounded-lg hover:bg-white/5"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                    </svg>
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    onFocus={() => setShowEmoji(false)}
                    placeholder="Type a message..."
                    className="flex-1 bg-navy/40 border border-purple-accent/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-accent/30 transition-all"
                    maxLength={500}
                />
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="p-2.5 bg-purple-accent/20 text-purple-light rounded-xl disabled:opacity-30 cursor-pointer hover:bg-purple-accent/30 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                </motion.button>
            </div>
        </div>
    );
}
