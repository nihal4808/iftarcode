"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface VideoTileProps {
    stream: MediaStream | null;
    name: string;
    isLocal?: boolean;
    isMuted?: boolean;
    isCameraOff?: boolean;
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export default function VideoTile({
    stream,
    name,
    isLocal = false,
    isMuted = false,
    isCameraOff = false,
}: VideoTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const hasVideo = stream && stream.getVideoTracks().length > 0 && !isCameraOff;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative rounded-2xl overflow-hidden bg-navy-light border border-purple-accent/10 aspect-video flex items-center justify-center"
        >
            {/* Video element */}
            {hasVideo ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
                />
            ) : (
                <div className="flex flex-col items-center justify-center gap-3 w-full h-full bg-gradient-to-br from-navy-light to-navy">
                    {/* Avatar placeholder */}
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-accent to-purple-dark flex items-center justify-center">
                        <span className="text-white text-xl md:text-2xl font-bold">
                            {getInitials(name)}
                        </span>
                    </div>
                </div>
            )}

            {/* Hidden video for stream when camera is off (keeps connection alive) */}
            {!hasVideo && stream && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="hidden"
                />
            )}

            {/* Name label */}
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <div className="glass-light rounded-lg px-3 py-1 flex items-center gap-2">
                    <span className="text-white text-xs font-medium truncate max-w-[120px]">
                        {isLocal ? `${name} (You)` : name}
                    </span>
                    {isMuted && (
                        <svg className="w-3.5 h-3.5 text-red-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M1.5 4.5l21 15m-21 0l21-15M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Local badge */}
            {isLocal && (
                <div className="absolute top-2 right-2">
                    <div className="bg-purple-accent/30 backdrop-blur-sm rounded-md px-2 py-0.5 text-[10px] text-purple-light font-medium">
                        YOU
                    </div>
                </div>
            )}
        </motion.div>
    );
}
