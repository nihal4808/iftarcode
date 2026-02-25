import { NextRequest, NextResponse } from "next/server";
import { getRoom, addParticipant, isNameTaken, getParticipants } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

export async function POST(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const code = params.code;
        const { name } = await request.json();

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const room = await getRoom(code.toUpperCase());
        if (!room) {
            return NextResponse.json({ error: "Room not found or expired" }, { status: 404 });
        }

        // Check for duplicate names
        if (await isNameTaken(room.id, name.trim())) {
            return NextResponse.json(
                { error: "This name is already taken in this room" },
                { status: 409 }
            );
        }

        const participant = await addParticipant({
            id: uuidv4(),
            roomId: room.id,
            name: name.trim(),
            joinedAt: Date.now(),
        });

        const participantList = await getParticipants(room.id);

        return NextResponse.json({
            participant: {
                id: participant.id,
                name: participant.name,
            },
            room: {
                code: room.code,
                hostName: room.hostName,
                city: room.city,
                maghribTime: room.maghribTime,
            },
            participantCount: participantList.length,
        });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
