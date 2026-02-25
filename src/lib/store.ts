import { Redis } from '@upstash/redis';

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
    roomId: string; // This is actually the room 'code' in many places, but we map it logically
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

const ROOM_EXPIRY_SECONDS = 6 * 60 * 60; // 6 hours
const SIGNAL_EXPIRY_SECONDS = 60; // 60 seconds

// ==========================================
// REDIS CLIENT INITIALIZATION
// ==========================================
// Will be null if env vars are missing
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = (redisUrl && redisToken)
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

// ==========================================
// IN-MEMORY FALLBACK (For Local Dev without Redis)
// ==========================================
const memRooms = new Map<string, Room>();
const memParticipants = new Map<string, Participant[]>();
const memMessages = new Map<string, Message[]>();
const memSignals = new Map<string, SignalMessage[]>();
const memRateLimits = new Map<string, number>();

function isMemoryRoomExpired(room: Room): boolean {
    return Date.now() - room.createdAt > (ROOM_EXPIRY_SECONDS * 1000);
}

function cleanupMemoryRoom(code: string) {
    const room = memRooms.get(code);
    if (room) {
        memParticipants.delete(room.id);
        memMessages.delete(room.id);
        memSignals.delete(room.id);
        memRooms.delete(code);
    }
}

// ==========================================
// ASYNC STORE OPERATIONS (Hybrid)
// ==========================================

export async function createRoom(room: Room): Promise<Room> {
    if (redis) {
        await redis.set(`room:${room.code}`, room, { ex: ROOM_EXPIRY_SECONDS });
    } else {
        memRooms.set(room.code, room);
        memParticipants.set(room.id, []);
        memMessages.set(room.id, []);
    }
    return room;
}

export async function getRoom(code: string): Promise<Room | null> {
    const upperCode = code.toUpperCase();

    if (redis) {
        const room = await redis.get<Room>(`room:${upperCode}`);
        return room || null;
    } else {
        const room = memRooms.get(upperCode);
        if (!room) return null;
        if (isMemoryRoomExpired(room)) {
            cleanupMemoryRoom(upperCode);
            return null;
        }
        return room;
    }
}

export async function addParticipant(participant: Participant): Promise<Participant> {
    if (redis) {
        const key = `participants:${participant.roomId}`;
        await redis.rpush(key, participant);
        await redis.expire(key, ROOM_EXPIRY_SECONDS);
    } else {
        const pList = memParticipants.get(participant.roomId) || [];
        pList.push(participant);
        memParticipants.set(participant.roomId, pList);
    }
    return participant;
}

export async function getParticipants(roomId: string): Promise<Participant[]> {
    if (redis) {
        return await redis.lrange<Participant>(`participants:${roomId}`, 0, -1) || [];
    } else {
        return memParticipants.get(roomId) || [];
    }
}

export async function isNameTaken(roomId: string, name: string): Promise<boolean> {
    const participants = await getParticipants(roomId);
    return participants.some((p) => p.name.toLowerCase() === name.toLowerCase());
}

export async function addMessage(message: Message): Promise<Message | null> {
    if (redis) {
        const rateKey = `rateLimit:${message.roomId}:${message.sender}`;
        // Basic rate limit via Redis SET NX PX
        const isLimited = await redis.set(rateKey, "1", { nx: true, px: 1000 });
        if (!isLimited) return null; // blocked by rate limit

        const msgKey = `messages:${message.roomId}`;
        await redis.rpush(msgKey, message);
        await redis.expire(msgKey, ROOM_EXPIRY_SECONDS);

        // Keep only last 100 messages (optional trim)
        // LTRIM keeps the elements in the range
        await redis.ltrim(msgKey, -100, -1);
    } else {
        const key = `${message.roomId}:${message.sender}`;
        const lastTime = memRateLimits.get(key) || 0;
        if (Date.now() - lastTime < 1000) return null;
        memRateLimits.set(key, Date.now());

        const mList = memMessages.get(message.roomId) || [];
        mList.push(message);
        if (mList.length > 100) mList.splice(0, mList.length - 100);
        memMessages.set(message.roomId, mList);
    }
    return message;
}

export async function getMessages(roomId: string): Promise<Message[]> {
    if (redis) {
        return await redis.lrange<Message>(`messages:${roomId}`, 0, -1) || [];
    } else {
        return memMessages.get(roomId) || [];
    }
}

export async function addSignal(signal: SignalMessage): Promise<SignalMessage> {
    if (redis) {
        const sigKey = `signals:${signal.roomId}`;
        await redis.rpush(sigKey, signal);
        await redis.expire(sigKey, SIGNAL_EXPIRY_SECONDS);
    } else {
        const sList = memSignals.get(signal.roomId) || [];
        sList.push(signal);

        const now = Date.now();
        const filtered = sList.filter(s => now - s.timestamp < SIGNAL_EXPIRY_SECONDS * 1000);
        memSignals.set(signal.roomId, filtered);
    }
    return signal;
}

export async function getSignals(roomId: string, targetPeerId: string, since: number): Promise<SignalMessage[]> {
    let signals: SignalMessage[] = [];

    if (redis) {
        signals = await redis.lrange<SignalMessage>(`signals:${roomId}`, 0, -1) || [];
    } else {
        signals = memSignals.get(roomId) || [];
    }

    const now = Date.now();
    return signals.filter(
        s => s.to === targetPeerId &&
            s.timestamp > since &&
            now - s.timestamp < SIGNAL_EXPIRY_SECONDS * 1000
    );
}

// For local memory parity (to lazily clean up rooms if not using redis TTL)
export function cleanupExpiredRooms() {
    if (!redis) {
        for (const [code, room] of memRooms.entries()) {
            if (isMemoryRoomExpired(room)) {
                cleanupMemoryRoom(code);
            }
        }
    }
}
