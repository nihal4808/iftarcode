import { NextRequest, NextResponse } from "next/server";
import { getRoom, addSignal, getSignals } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

// POST: Send a signaling message to a specific peer
export async function POST(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const code = params.code;
        const { from, to, type, data } = await request.json();

        if (!from || !to || !type || !data) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!["offer", "answer", "ice-candidate"].includes(type)) {
            return NextResponse.json({ error: "Invalid signal type" }, { status: 400 });
        }

        const room = await getRoom(code.toUpperCase());
        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const signal = await addSignal({
            id: uuidv4(),
            roomId: room.id,
            from,
            to,
            type,
            data,
            timestamp: Date.now(),
        });

        return NextResponse.json({ signal: { id: signal.id } });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET: Poll for signaling messages destined for this peer
export async function GET(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const code = params.code;
        const searchParams = request.nextUrl.searchParams;
        const peerId = searchParams.get("peerId");
        const since = parseInt(searchParams.get("since") || "0", 10);

        if (!peerId) {
            return NextResponse.json({ error: "peerId is required" }, { status: 400 });
        }

        const room = await getRoom(code.toUpperCase());
        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const pendingSignals = await getSignals(room.id, peerId, since);

        return NextResponse.json({
            signals: pendingSignals.map(s => ({
                id: s.id,
                from: s.from,
                to: s.to,
                type: s.type,
                data: s.data,
                timestamp: s.timestamp,
            })),
        });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
