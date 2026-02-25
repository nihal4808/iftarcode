import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set, get, child } from "firebase/database";

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
// FIREBASE CLIENT INITIALIZATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAFZGq1B6oge9gIsQlsqApWzGjSLX8lr78",
    authDomain: "iftarcode.firebaseapp.com",
    projectId: "iftarcode",
    storageBucket: "iftarcode.firebasestorage.app",
    messagingSenderId: "46679653575",
    appId: "1:46679653575:web:71b597a56af92d98cdd2e2"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

// ==========================================
// ASYNC STORE OPERATIONS (Firebase Realtime DB)
// ==========================================

export async function createRoom(room: Room): Promise<Room> {
    const roomRef = ref(db, `rooms/${room.code}`);
    await set(roomRef, room);
    return room;
}

export async function getRoom(code: string): Promise<Room | null> {
    const upperCode = code.toUpperCase();
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `rooms/${upperCode}`));

    if (snapshot.exists()) {
        const room = snapshot.val() as Room;
        // Lazy cleanup if expired
        if (Date.now() - room.createdAt > ROOM_EXPIRY_MS) {
            await set(ref(db, `rooms/${upperCode}`), null);
            return null;
        }
        return room;
    }
    return null;
}

export async function addParticipant(participant: Participant): Promise<Participant> {
    const pRef = ref(db, `participants/${participant.roomId}/${participant.id}`);
    await set(pRef, participant);
    return participant;
}

export async function getParticipants(roomId: string): Promise<Participant[]> {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `participants/${roomId}`));
    if (snapshot.exists()) {
        return Object.values(snapshot.val()) as Participant[];
    }
    return [];
}

export async function isNameTaken(roomId: string, name: string): Promise<boolean> {
    const participants = await getParticipants(roomId);
    return participants.some((p) => p.name.toLowerCase() === name.toLowerCase());
}

export async function addMessage(message: Message): Promise<Message | null> {
    // Basic rate limit via standalone timestamp path (1 msg / sec)
    const rateRef = ref(db, `rateLimits/${message.roomId}_${message.sender}`);
    const rateSnapshot = await get(rateRef);
    const lastTime = rateSnapshot.exists() ? rateSnapshot.val() : 0;

    if (Date.now() - lastTime < 1000) return null; // blocked by rate limit
    await set(rateRef, Date.now());

    const msgsRef = ref(db, `messages/${message.roomId}/${message.id}`);
    await set(msgsRef, message);
    return message;
}

export async function getMessages(roomId: string): Promise<Message[]> {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `messages/${roomId}`));
    if (snapshot.exists()) {
        const msgs = Object.values(snapshot.val()) as Message[];
        // Realtime DB objects are unordered loosely, sort by timestamp
        return msgs.sort((a, b) => a.timestamp - b.timestamp).slice(-100);
    }
    return [];
}

export async function addSignal(signal: SignalMessage): Promise<SignalMessage> {
    const sigRef = ref(db, `signals/${signal.roomId}/${signal.id}`);
    await set(sigRef, signal);
    return signal;
}

export async function getSignals(roomId: string, targetPeerId: string, since: number): Promise<SignalMessage[]> {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `signals/${roomId}`));

    if (snapshot.exists()) {
        const sigs = Object.values(snapshot.val()) as SignalMessage[];
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
