// In-memory data store - works without Firebase for development
// Data persists only while the server is running

export interface Room {
    id: string;
    code: string;
    hostName: string;
    city: string;
    country: string;
    maghribTime: string; // HH:MM format
    createdAt: number; // timestamp ms
}

export interface Participant {
    id: string;
    roomId: string;
    name: string;
    joinedAt: number;
}

export interface Message {
    id: string;
    roomId: string;
    sender: string;
    text: string;
    timestamp: number;
}

export interface SignalMessage {
    id: string;
    roomId: string;
    from: string; // sender peerId
    to: string;   // target peerId
    type: "offer" | "answer" | "ice-candidate";
    data: string; // JSON stringified SDP or ICE candidate
    timestamp: number;
}

// In-memory maps
const rooms = new Map<string, Room>(); // code -> room
const participants = new Map<string, Participant[]>(); // roomId -> participants
const messages = new Map<string, Message[]>(); // roomId -> messages
const signals = new Map<string, SignalMessage[]>(); // roomId -> signal messages
const rateLimits = new Map<string, number>(); // `${roomId}:${sender}` -> last message timestamp

const ROOM_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours
const SIGNAL_EXPIRY_MS = 60 * 1000; // 60 seconds

function isRoomExpired(room: Room): boolean {
    return Date.now() - room.createdAt > ROOM_EXPIRY_MS;
}

function cleanupRoom(code: string) {
    const room = rooms.get(code);
    if (room) {
        participants.delete(room.id);
        messages.delete(room.id);
        signals.delete(room.id);
        rooms.delete(code);
    }
}

// Room operations
export function createRoom(room: Room): Room {
    rooms.set(room.code, room);
    participants.set(room.id, []);
    messages.set(room.id, []);
    return room;
}

export function getRoom(code: string): Room | null {
    const room = rooms.get(code.toUpperCase());
    if (!room) return null;
    if (isRoomExpired(room)) {
        cleanupRoom(code);
        return null;
    }
    return room;
}

// Participant operations
export function addParticipant(participant: Participant): Participant {
    const roomParticipants = participants.get(participant.roomId) || [];
    roomParticipants.push(participant);
    participants.set(participant.roomId, roomParticipants);
    return participant;
}

export function getParticipants(roomId: string): Participant[] {
    return participants.get(roomId) || [];
}

export function isNameTaken(roomId: string, name: string): boolean {
    const roomParticipants = participants.get(roomId) || [];
    return roomParticipants.some(
        (p) => p.name.toLowerCase() === name.toLowerCase()
    );
}

// Message operations
export function addMessage(message: Message): Message | null {
    // Rate limiting: 1 message per second per user per room
    const key = `${message.roomId}:${message.sender}`;
    const lastTime = rateLimits.get(key) || 0;
    if (Date.now() - lastTime < 1000) {
        return null; // Rate limited
    }
    rateLimits.set(key, Date.now());

    const roomMessages = messages.get(message.roomId) || [];
    roomMessages.push(message);
    // Keep only last 100 messages
    if (roomMessages.length > 100) {
        roomMessages.splice(0, roomMessages.length - 100);
    }
    messages.set(message.roomId, roomMessages);
    return message;
}

export function getMessages(roomId: string): Message[] {
    return messages.get(roomId) || [];
}

// Periodic cleanup (called lazily)
export function cleanupExpiredRooms() {
    for (const [code, room] of rooms.entries()) {
        if (isRoomExpired(room)) {
            cleanupRoom(code);
        }
    }
}

// Signal operations (WebRTC signaling)
export function addSignal(signal: SignalMessage): SignalMessage {
    const roomSignals = signals.get(signal.roomId) || [];
    roomSignals.push(signal);
    // Keep only recent signals (cleanup expired)
    const now = Date.now();
    const filtered = roomSignals.filter(s => now - s.timestamp < SIGNAL_EXPIRY_MS);
    signals.set(signal.roomId, filtered);
    return signal;
}

export function getSignals(roomId: string, targetPeerId: string, since: number): SignalMessage[] {
    const roomSignals = signals.get(roomId) || [];
    const now = Date.now();
    // Filter: for this peer, after the given timestamp, not expired
    return roomSignals.filter(
        s => s.to === targetPeerId && s.timestamp > since && now - s.timestamp < SIGNAL_EXPIRY_MS
    );
}

