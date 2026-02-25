"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VideoTile from "./VideoTile";

interface PeerConnection {
    peerId: string;
    peerName: string;
    connection: RTCPeerConnection;
    stream: MediaStream | null;
}

interface VideoChatProps {
    roomCode: string;
    userName: string;
    participants: { id: string; name: string }[];
}

// ICE Servers are now fetched dynamically inside the component

const SIGNAL_POLL_INTERVAL = 1000; // 1 second

export default function VideoChat({ roomCode, userName, participants }: VideoChatProps) {
    const [inCall, setInCall] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
    const [joining, setJoining] = useState(false);
    const [iceServers, setIceServers] = useState<RTCConfiguration>({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
        ]
    });

    const peerId = useRef<string>(userName);
    const peersRef = useRef<Map<string, PeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSignalTime = useRef<number>(Date.now() - 10000);

    // Sync peersRef with state
    const updatePeers = useCallback(() => {
        setPeers(new Map(peersRef.current));
    }, []);

    // Fetch ICE servers on mount
    useEffect(() => {
        async function fetchIceServers() {
            try {
                const res = await fetch("/api/turn");
                if (res.ok) {
                    const data = await res.json();
                    if (data.iceServers) {
                        setIceServers({ iceServers: data.iceServers });
                    }
                }
            } catch {
                console.error("Failed to fetch ICE servers");
            }
        }
        fetchIceServers();
    }, []);

    // Send a signaling message
    const sendSignal = useCallback(async (to: string, type: string, data: string) => {
        try {
            await fetch(`/api/rooms/${roomCode}/signal`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    from: peerId.current,
                    to,
                    type,
                    data,
                }),
            });
        } catch {
            // Silent fail
        }
    }, [roomCode]);

    // Create an RTCPeerConnection for a remote peer
    const createPeerConnection = useCallback((remotePeerId: string, remotePeerName: string): RTCPeerConnection => {
        const pc = new RTCPeerConnection(iceServers);

        // Add local tracks to the connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle incoming tracks from remote peer
        const remoteStream = new MediaStream();
        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track);
            });
            const peerConn = peersRef.current.get(remotePeerId);
            if (peerConn) {
                peerConn.stream = remoteStream;
                updatePeers();
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal(remotePeerId, "ice-candidate", JSON.stringify(event.candidate));
            }
        };

        // Store the peer connection
        peersRef.current.set(remotePeerId, {
            peerId: remotePeerId,
            peerName: remotePeerName,
            connection: pc,
            stream: remoteStream,
        });
        updatePeers();

        return pc;
    }, [sendSignal, updatePeers]);

    // Handle incoming signaling messages
    const handleSignal = useCallback(async (signal: { from: string; type: string; data: string }) => {
        const { from, type, data } = signal;

        // Skip our own messages
        if (from === peerId.current) return;

        const remoteName = from;

        try {
            if (type === "offer") {
                // Someone is calling us
                let pc = peersRef.current.get(from)?.connection;
                if (pc) {
                    // They rejoined, close old connection
                    pc.close();
                    peersRef.current.delete(from);
                }
                pc = createPeerConnection(from, remoteName);

                await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(data)));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendSignal(from, "answer", JSON.stringify(answer));

            } else if (type === "answer") {
                // We received an answer
                const pc = peersRef.current.get(from)?.connection;
                if (pc && pc.signalingState !== "stable") {
                    await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(data)));
                }

            } else if (type === "ice-candidate") {
                // We received an ICE candidate
                const pc = peersRef.current.get(from)?.connection;
                if (pc) {
                    await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(data)));
                }
            }
        } catch (err) {
            console.error(`Error processing ${type} from ${from}:`, err);
        }
    }, [createPeerConnection, sendSignal]);

    // Poll for signaling messages
    const pollSignals = useCallback(async () => {
        try {
            const res = await fetch(
                `/api/rooms/${roomCode}/signal?peerId=${encodeURIComponent(peerId.current)}&since=${lastSignalTime.current}`
            );
            if (!res.ok) return;

            const data = await res.json();
            if (data.signals && data.signals.length > 0) {
                let maxTime = lastSignalTime.current;

                for (const signal of data.signals) {
                    if (signal.timestamp > maxTime) {
                        maxTime = signal.timestamp;
                    }
                    await handleSignal(signal);
                }

                // Update time even if handleSignal fails to prevent infinite loop
                lastSignalTime.current = maxTime;
            }
        } catch {
            // Silent fail on poll
        }
    }, [roomCode, handleSignal]);

    // Join call - get media and start connecting to peers
    const joinCall = useCallback(async () => {
        setJoining(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
                audio: { echoCancellation: true, noiseSuppression: true },
            });

            localStreamRef.current = stream;
            setLocalStream(stream);
            setInCall(true);
            setJoining(false);
            lastSignalTime.current = Date.now() - 5000; // Get signals from last 5 seconds

            // Start polling for signals
            pollTimerRef.current = setInterval(pollSignals, SIGNAL_POLL_INTERVAL);

            // Wait a moment for local setup, then call other participants
            setTimeout(async () => {
                for (const p of participants) {
                    if (p.name === userName) continue; // Don't call ourselves

                    try {
                        const pc = createPeerConnection(p.name, p.name);
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        sendSignal(p.name, "offer", JSON.stringify(offer));
                    } catch (err) {
                        console.error("Error creating offer for", p.name, err);
                    }
                }
            }, 1000);

        } catch (err) {
            console.error("Failed to access camera/mic:", err);
            setJoining(false);
        }
    }, [participants, userName, createPeerConnection, sendSignal, pollSignals]);

    // Leave call
    const leaveCall = useCallback(() => {
        // Stop polling
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }

        // Close all peer connections
        peersRef.current.forEach(peer => {
            peer.connection.close();
        });
        peersRef.current.clear();
        updatePeers();

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
        }

        setInCall(false);
        setJoining(false);
        setIsMuted(false);
        setIsCameraOff(false);
    }, [updatePeers]);

    // Toggle microphone
    const toggleMic = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(prev => !prev);
        }
    }, []);

    // Toggle camera
    const toggleCamera = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCameraOff(prev => !prev);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        const currentPeers = peersRef.current;
        const currentStream = localStreamRef.current;
        const currentPollTimer = pollTimerRef.current;
        return () => {
            if (currentPollTimer) {
                clearInterval(currentPollTimer);
            }
            currentPeers.forEach(peer => peer.connection.close());
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Not in call - show join button
    if (!inCall) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6 text-center"
            >
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-accent/20 to-purple-dark/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-purple-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg">Video & Audio Call</h3>
                        <p className="text-slate-500 text-sm mt-1">Join the call to chat face-to-face</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={joinCall}
                        disabled={joining}
                        className="btn-glow px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                        {joining ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            />
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                                Join Call
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    // In call - show video grid + controls
    const peerList = Array.from(peers.values());
    const totalParticipants = peerList.length + 1; // +1 for local

    // Determine grid layout dynamically based on Google Meet logic
    let gridClass = "grid-cols-1";
    if (totalParticipants === 2) gridClass = "md:grid-cols-2";
    else if (totalParticipants === 3 || totalParticipants === 4) gridClass = "grid-cols-2";
    else if (totalParticipants >= 5 && totalParticipants <= 9) gridClass = "grid-cols-2 md:grid-cols-3";
    else if (totalParticipants > 9) gridClass = "grid-cols-3 md:grid-cols-4";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-[500px] md:h-[650px] space-y-4"
        >
            {/* Video Grid Area */}
            <div className="flex-1 w-full bg-navy-dark/40 rounded-3xl p-3 md:p-4 overflow-hidden shadow-inner border border-white/5">
                <div className={`grid ${gridClass} gap-3 md:gap-4 h-full w-full auto-rows-fr`}>
                    {/* Local video */}
                    <div className="relative w-full h-full min-h-[150px] flex items-center justify-center">
                        <VideoTile
                            stream={localStream}
                            name={userName}
                            isLocal
                            isMuted={isMuted}
                            isCameraOff={isCameraOff}
                        />
                    </div>

                    {/* Remote videos */}
                    <AnimatePresence>
                        {peerList.map((peer) => (
                            <motion.div
                                key={peer.peerId}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative w-full h-full min-h-[150px] flex items-center justify-center"
                            >
                                <VideoTile
                                    stream={peer.stream}
                                    name={peer.peerName}
                                    isMuted={false} // Would need remote mute state tracking for fully accurate indicator
                                    isCameraOff={!peer.stream || peer.stream.getVideoTracks().length === 0}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="glass rounded-2xl px-6 py-3 flex items-center justify-center gap-4">
                {/* Mic toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMic}
                    className={`p-3 rounded-full cursor-pointer transition-all ${isMuted
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 19 17.591 17.591 5.409 5.409 4 4" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 5.592-3.819M12 18.75v3.75m-3.75 0h7.5M8.689 8.689a3 3 0 0 0 4.622 4.622M12 2.25a3 3 0 0 1 3 3v4.5" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                        </svg>
                    )}
                </motion.button>

                {/* Camera toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleCamera}
                    className={`p-3 rounded-full cursor-pointer transition-all ${isCameraOff
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                    title={isCameraOff ? "Turn on camera" : "Turn off camera"}
                >
                    {isCameraOff ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5 20.47 5.78a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                    )}
                </motion.button>

                {/* Divider */}
                <div className="w-px h-8 bg-white/10" />

                {/* Leave call */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={leaveCall}
                    className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full cursor-pointer transition-all shadow-lg shadow-red-500/20"
                    title="Leave call"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75 18 6m0 0 2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5a16.5 16.5 0 0 1-16.5-16.5 1.5 1.5 0 0 1 1.5-1.5h2.25a1.5 1.5 0 0 1 1.393.949l1.165 2.914a1.5 1.5 0 0 1-.393 1.68l-.646.535a.375.375 0 0 0-.087.408 12.002 12.002 0 0 0 5.14 5.14.375.375 0 0 0 .408-.087l.535-.646a1.5 1.5 0 0 1 1.68-.393l2.914 1.165a1.5 1.5 0 0 1 .949 1.393v2.25a1.5 1.5 0 0 1-1.5 1.5Z" />
                    </svg>
                </motion.button>
            </div>
        </motion.div>
    );
}
