import { NextRequest, NextResponse } from "next/server";
import { createRoom, getRoom, addParticipant } from "@/lib/store";
import { generateRoomCode } from "@/lib/room-code";
import { getCityByName } from "@/lib/cities";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    try {
        const { hostName, city } = await request.json();

        if (!hostName || typeof hostName !== "string" || hostName.trim().length === 0) {
            return NextResponse.json({ error: "Host name is required" }, { status: 400 });
        }

        if (!city || typeof city !== "string") {
            return NextResponse.json({ error: "City is required" }, { status: 400 });
        }

        const cityData = getCityByName(city);
        if (!cityData) {
            return NextResponse.json({ error: "Invalid city" }, { status: 400 });
        }

        // Generate unique code (retry if collision)
        let code = generateRoomCode();
        let attempts = 0;
        while (getRoom(code) && attempts < 10) {
            code = generateRoomCode();
            attempts++;
        }

        // Fetch Maghrib time from Aladhan API
        let maghribTime = "18:30"; // Default fallback
        try {
            const today = new Date();
            const dateStr = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;
            const apiUrl = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(cityData.name)}&country=${encodeURIComponent(cityData.country)}&method=2`;

            const res = await fetch(apiUrl, { next: { revalidate: 3600 } });
            if (res.ok) {
                const data = await res.json();
                if (data?.data?.timings?.Maghrib) {
                    // Format: "HH:MM (TIMEZONE)" - extract just HH:MM
                    maghribTime = data.data.timings.Maghrib.split(" ")[0];
                }
            }
        } catch {
            // Use default fallback
        }

        const roomId = uuidv4();
        const room = createRoom({
            id: roomId,
            code,
            hostName: hostName.trim(),
            city: cityData.name,
            country: cityData.country,
            maghribTime,
            createdAt: Date.now(),
        });

        // Add host as first participant
        addParticipant({
            id: uuidv4(),
            roomId: room.id,
            name: hostName.trim(),
            joinedAt: Date.now(),
        });

        return NextResponse.json({
            code: room.code,
            roomId: room.id,
            maghribTime,
        });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
