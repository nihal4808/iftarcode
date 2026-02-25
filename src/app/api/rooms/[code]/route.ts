import { NextRequest, NextResponse } from "next/server";
import { getRoom, getParticipants, cleanupExpiredRooms } from "@/lib/store";

export async function GET(
    _request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const code = params.code;

        // Lazy cleanup
        cleanupExpiredRooms();

        const room = await getRoom(code.toUpperCase());
        if (!room) {
            return NextResponse.json({ error: "Room not found or expired" }, { status: 404 });
        }

        const participantList = await getParticipants(room.id);

        return NextResponse.json({
            room: {
                code: room.code,
                hostName: room.hostName,
                city: room.city,
                country: room.country,
                maghribTime: room.maghribTime,
                createdAt: room.createdAt,
            },
            participants: participantList.map((p) => ({
                id: p.id,
                name: p.name,
                joinedAt: p.joinedAt,
            })),
        });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
