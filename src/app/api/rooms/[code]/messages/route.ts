import { NextRequest, NextResponse } from "next/server";
import { getRoom, getMessages, addMessage } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

export async function GET(
    _request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const code = params.code;
        const room = getRoom(code.toUpperCase());
        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const msgs = getMessages(room.id);
        return NextResponse.json({
            messages: msgs.map((m) => ({
                id: m.id,
                sender: m.sender,
                text: m.text,
                timestamp: m.timestamp,
            })),
        });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const code = params.code;
        const { sender, text } = await request.json();

        if (!sender || typeof sender !== "string" || !text || typeof text !== "string") {
            return NextResponse.json({ error: "Sender and text are required" }, { status: 400 });
        }

        if (text.trim().length === 0 || text.length > 500) {
            return NextResponse.json({ error: "Invalid message length" }, { status: 400 });
        }

        const room = getRoom(code.toUpperCase());
        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const message = addMessage({
            id: uuidv4(),
            roomId: room.id,
            sender: sender.trim(),
            text: text.trim(),
            timestamp: Date.now(),
        });

        if (!message) {
            return NextResponse.json(
                { error: "You are sending messages too quickly" },
                { status: 429 }
            );
        }

        return NextResponse.json({ message });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
