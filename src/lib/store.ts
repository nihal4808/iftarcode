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
    roomId: string; // Used as the parent node
    from: string; // sender peerId
    to: string;   // target peerId
    type: "offer" | "answer" | "ice-candidate";
    data: string; // JSON stringified SDP or ICE candidate
    timestamp: number;
}

const ROOM_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours
const SIGNAL_EXPIRY_MS = 60 * 1000; // 60 seconds

// ==========================================
// FIREBASE REST API CONFIGURATION
// ==========================================
const FIREBASE_DB_URL = "https://iftarcode-default-rtdb.firebaseio.com";
// Firebase Web API Key
const FIREBASE_API_KEY = "AIzaSyAFZGq1B6oge9gIsQlsqApWzGjSLX8lr78";

async function firebaseGet<T>(path: string): Promise<T | null> {
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/${path}.json?key=${FIREBASE_API_KEY}`, {
            cache: 'no-store'
        });
        if (!res.ok) {
            console.error(`Firebase GET Error: ${res.status} ${res.statusText}`);
            return null;
        }
        return res.json();
    } catch (e) {
        console.error(`Firebase GET Exception:`, e);
        return null;
    }
}

async function firebaseSet(path: string, data: any): Promise<boolean> {
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/${path}.json?key=${FIREBASE_API_KEY}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            console.error(`Firebase SET Error: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error(`Firebase SET Error Body:`, text);
        }
        return res.ok;
    } catch (e) {
        console.error(`Firebase SET Exception:`, e);
        return false;
    }
}

// ==========================================
// ASYNC STORE OPERATIONS
// ==========================================

export async function createRoom(room: Room): Promise<Room> {
    await firebaseSet(`rooms/${room.code.toUpperCase()}`, room);
    return room;
}

export async function getRoom(code: string): Promise<Room | null> {
    const upperCode = code.toUpperCase();
    const room = await firebaseGet<Room>(`rooms/${upperCode}`);

    if (room) {
        // Lazy cleanup if expired
        if (Date.now() - room.createdAt > ROOM_EXPIRY_MS) {
            await firebaseSet(`rooms/${upperCode}`, null);
            return null;
        }
        return room;
    }
    return null;
}

export async function addParticipant(participant: Participant): Promise<Participant> {
    await firebaseSet(`participants/${participant.roomId}/${participant.id}`, participant);
    return participant;
}

export async function getParticipants(roomId: string): Promise<Participant[]> {
    const participantsDict = await firebaseGet<Record<string, Participant>>(`participants/${roomId}`);
    if (participantsDict) {
        return Object.values(participantsDict);
    }
    return [];
}

export async function isNameTaken(roomId: string, name: string): Promise<boolean> {
    const participants = await getParticipants(roomId);
    return participants.some((p) => p.name.toLowerCase() === name.toLowerCase());
}

export async function addMessage(message: Message): Promise<Message | null> {
    // Basic rate limit via standalone timestamp path (1 msg / sec)
    const ratePath = `rateLimits/${message.roomId}_${message.sender}`;
    const lastTime = await firebaseGet<number>(ratePath) || 0;

    if (Date.now() - lastTime < 1000) return null; // blocked by rate limit
    await firebaseSet(ratePath, Date.now());

    await firebaseSet(`messages/${message.roomId}/${message.id}`, message);
    return message;
}

export async function getMessages(roomId: string): Promise<Message[]> {
    const msgsDict = await firebaseGet<Record<string, Message>>(`messages/${roomId}`);
    if (msgsDict) {
        const msgs = Object.values(msgsDict);
        return msgs.sort((a, b) => a.timestamp - b.timestamp).slice(-100);
    }
    return [];
}

export async function addSignal(signal: SignalMessage): Promise<SignalMessage> {
    await firebaseSet(`signals/${signal.roomId}/${signal.id}`, signal);
    return signal;
}

export async function getSignals(roomId: string, targetPeerId: string, since: number): Promise<SignalMessage[]> {
    const sigsDict = await firebaseGet<Record<string, SignalMessage>>(`signals/${roomId}`);

    if (sigsDict) {
        const sigs = Object.values(sigsDict);
        const now = Date.now();
        // Filter messages exclusively for targetPeerId, created after `since`, and unexpired
        return sigs.filter(
            s => s.to === targetPeerId &&
                s.timestamp > since &&
                now - s.timestamp < SIGNAL_EXPIRY_MS
        );
    }
    return [];
}

export function cleanupExpiredRooms() {
    // No-op for Firebase. Firebase handles persistence logic; we lazy delete in `getRoom`
}
