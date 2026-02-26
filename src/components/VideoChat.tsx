"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VideoTile from "./VideoTile";
import { io, Socket } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";

interface PeerConnection {
    peerId: string;
    peerName: string;
    stream: MediaStream | null;
}

interface VideoChatProps {
    roomCode: string;
    userName: string;
    participants: { id: string; name: string }[];
}

export default function VideoChat({ roomCode, userName }: VideoChatProps) {
    const [inCall, setInCall] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
    const [joining, setJoining] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const deviceRef = useRef<mediasoupClient.Device | null>(null);
    const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
    const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);

    const consumersRef = useRef<Map<string, mediasoupClient.types.Consumer>>(new Map());
    const producersRef = useRef<Map<string, mediasoupClient.types.Producer>>(new Map());
    const peersRef = useRef<Map<string, PeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);

    const updatePeersState = useCallback(() => {
        setPeers(new Map(peersRef.current));
    }, []);

    const ensureRemoteStream = useCallback((peerId: string, peerName: string) => {
        let peer = peersRef.current.get(peerId);
        if (!peer) {
            peer = { peerId, peerName, stream: new MediaStream() };
            peersRef.current.set(peerId, peer);
        }
        return peer.stream!;
    }, []);

    const consume = useCallback(async (
        producerId: string,
        peerId: string,
        peerName: string,
        kind: string
    ) => {
        if (!deviceRef.current || !recvTransportRef.current || !socketRef.current) return;

        const rtpCapabilities = deviceRef.current.rtpCapabilities;
        const result = await new Promise<any>((resolve, reject) => {
            socketRef.current!.emit('consume', {
                rtpCapabilities,
                remoteProducerId: producerId,
                serverConsumerTransportId: recvTransportRef.current!.id
            }, (res: any) => {
                if (res.error) reject(new Error(res.error));
                else resolve(res);
            });
        });

        const { id, kind: consumerKind, rtpParameters } = result.params;
        const consumer = await recvTransportRef.current.consume({
            id,
            producerId,
            kind: consumerKind,
            rtpParameters
        });

        consumersRef.current.set(consumer.id, consumer);

        const stream = ensureRemoteStream(peerId, peerName);
        stream.addTrack(consumer.track);
        updatePeersState();

        // Resume consumer server-side
        socketRef.current.emit('resumeConsumer', { consumerId: consumer.id }, () => { });
    }, [ensureRemoteStream, updatePeersState]);

    const initSocketsAndMediasoup = useCallback(async (stream: MediaStream) => {
        return new Promise<void>((resolve, reject) => {
            // Using a hardcoded URL for the dev SFU server, should be env var in production
            const SFU_URL = process.env.NEXT_PUBLIC_SFU_URL || "http://localhost:4000";
            const socket = io(SFU_URL);
            socketRef.current = socket;

            socket.on("connect", () => {
                socket.emit("joinRoom", { roomId: roomCode, userName }, async (res: any) => {
                    if (res.error) {
                        return reject(new Error(res.error));
                    }
                    try {
                        // 1. Initialize device
                        const device = new mediasoupClient.Device();
                        deviceRef.current = device;
                        await device.load({ routerRtpCapabilities: res.rtpCapabilities });

                        // 2. Create send transport
                        const sendTransportInfo = await new Promise<any>((resData, rej) => {
                            socket.emit("createWebRtcTransport", { sender: true }, (data: any) => {
                                if (data.error) rej(new Error(data.error));
                                else resData(data.params);
                            });
                        });
                        const sendTransport = device.createSendTransport(sendTransportInfo);
                        sendTransportRef.current = sendTransport;

                        sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
                            socket.emit("connectTransport", { transportId: sendTransport.id, dtlsParameters }, (resp: any) => {
                                if (resp.error) errback(new Error(resp.error));
                                else callback();
                            });
                        });

                        sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
                            socket.emit("produce", { transportId: sendTransport.id, kind, rtpParameters, appData }, (resp: any) => {
                                if (resp.error) errback(new Error(resp.error));
                                else callback({ id: resp.id });
                            });
                        });

                        // 3. Create receive transport
                        const recvTransportInfo = await new Promise<any>((resData, rej) => {
                            socket.emit("createWebRtcTransport", { sender: false }, (data: any) => {
                                if (data.error) rej(new Error(data.error));
                                else resData(data.params);
                            });
                        });
                        const recvTransport = device.createRecvTransport(recvTransportInfo);
                        recvTransportRef.current = recvTransport;

                        recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
                            socket.emit("connectTransport", { transportId: recvTransport.id, dtlsParameters }, (resp: any) => {
                                if (resp.error) errback(new Error(resp.error));
                                else callback();
                            });
                        });

                        // 4. Produce local tracks
                        const videoTrack = stream.getVideoTracks()[0];
                        if (videoTrack) {
                            const producer = await sendTransport.produce({ track: videoTrack, encodings: [{ maxBitrate: 500000 }] });
                            producersRef.current.set(producer.id, producer);
                        }
                        const audioTrack = stream.getAudioTracks()[0];
                        if (audioTrack) {
                            const producer = await sendTransport.produce({ track: audioTrack });
                            producersRef.current.set(producer.id, producer);
                        }

                        // 5. Consume existing producers
                        socket.emit("getProducers", {}, (producers: any[]) => {
                            for (const p of producers) {
                                consume(p.producerId, p.peerId, p.peerName, p.kind);
                            }
                        });

                        resolve();

                    } catch (err) {
                        console.error("Mediasoup initialization failed:", err);
                        reject(err);
                    }
                });
            });

            socket.on("newProducer", ({ producerId, peerId, peerName, kind }) => {
                consume(producerId, peerId, peerName, kind);
            });

            socket.on("peerLeft", ({ peerId }) => {
                peersRef.current.delete(peerId);
                updatePeersState();
            });

            socket.on("consumerClosed", ({ consumerId }) => {
                const consumer = consumersRef.current.get(consumerId);
                if (consumer) {
                    consumer.close();
                    consumersRef.current.delete(consumerId);
                }
            });

            socket.on("connect_error", (err) => {
                console.error("Socket connect error:", err);
                reject(err);
            });
        });
    }, [roomCode, userName, consume, updatePeersState]);

    const joinCall = useCallback(async () => {
        setJoining(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
                audio: { echoCancellation: true, noiseSuppression: true },
            });

            localStreamRef.current = stream;
            setLocalStream(stream);

            await initSocketsAndMediasoup(stream);

            setInCall(true);
            setJoining(false);
        } catch (err) {
            console.error("Failed to access camera/mic or connect to SFU:", err);
            setJoining(false);
        }
    }, [initSocketsAndMediasoup]);

    const leaveCall = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit("leaveRoom");
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        if (sendTransportRef.current) {
            sendTransportRef.current.close();
            sendTransportRef.current = null;
        }
        if (recvTransportRef.current) {
            recvTransportRef.current.close();
            recvTransportRef.current = null;
        }
        deviceRef.current = null;

        consumersRef.current.forEach(c => c.close());
        consumersRef.current.clear();
        producersRef.current.forEach(p => p.close());
        producersRef.current.clear();

        peersRef.current.clear();
        updatePeersState();

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
        }

        setInCall(false);
        setJoining(false);
        setIsMuted(false);
        setIsCameraOff(false);
    }, [updatePeersState]);

    const toggleMic = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(prev => !prev);
        }
    }, []);

    const toggleCamera = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCameraOff(prev => !prev);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

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
                        <p className="text-slate-500 text-sm mt-1">Join the call to chat face-to-face via SFU</p>
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

    const peerList = Array.from(peers.values());
    const totalParticipants = peerList.length + 1;

    let gridClass = "grid-cols-1";
    if (totalParticipants === 2) gridClass = "md:grid-cols-2";
    else if (totalParticipants === 3 || totalParticipants === 4) gridClass = "grid-cols-2";
    else if (totalParticipants >= 5 && totalParticipants <= 9) gridClass = "grid-cols-2 md:grid-cols-3";
    else if (totalParticipants > 9) gridClass = "grid-cols-3 md:grid-cols-4";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-[600px] md:h-[750px] space-y-4"
        >
            <div className="flex-1 w-full bg-navy-dark/40 rounded-3xl p-3 md:p-4 overflow-y-auto shadow-inner border border-white/5 custom-scrollbar">
                <div className={`grid ${gridClass} gap-3 md:gap-4 w-full auto-rows-max`}>
                    <div className="relative w-full aspect-video min-h-[150px] flex items-center justify-center">
                        <VideoTile
                            stream={localStream}
                            name={userName}
                            isLocal
                            isMuted={isMuted}
                            isCameraOff={isCameraOff}
                        />
                    </div>

                    <AnimatePresence>
                        {peerList.map((peer) => (
                            <motion.div
                                key={peer.peerId}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative w-full aspect-video min-h-[150px] flex items-center justify-center"
                            >
                                <VideoTile
                                    stream={peer.stream}
                                    name={peer.peerName}
                                    isMuted={false}
                                    isCameraOff={!peer.stream || peer.stream.getVideoTracks().length === 0}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <div className="glass rounded-2xl px-6 py-3 flex items-center justify-center gap-4">
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

                <div className="w-px h-8 bg-white/10" />

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
