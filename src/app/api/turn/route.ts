import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Metered API Key provided by user
        const API_KEY = "00467d2f20d374a0c34ecaca8b942fd60454";
        const response = await fetch(`https://iftarcode.metered.live/api/v1/turn/credentials?apiKey=${API_KEY}`);

        if (!response.ok) {
            throw new Error("Failed to fetch from Metered");
        }

        const meteredIceServers = await response.json();

        // Always include Google STUN as a fallback base
        const baseIceServers = [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
        ];

        return NextResponse.json({
            // Combine Google STUN with the fetched Metered TURN/STUN servers
            iceServers: [...baseIceServers, ...meteredIceServers],
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch ICE servers" }, { status: 500 });
    }
}
