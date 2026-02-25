import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Metered TURN Server credentials
        const turnServer = {
            urls: "turn:global.relay.metered.ca:80",
            username: "18a1829fad648fa0a576a7a7",
            credential: "HaZSE9Ihf0fxnzsX",
        };

        const turnServerTls = {
            urls: "turn:global.relay.metered.ca:443",
            username: "18a1829fad648fa0a576a7a7",
            credential: "HaZSE9Ihf0fxnzsX",
        };

        const turnServerUdp = {
            urls: "turn:global.relay.metered.ca:443?transport=tcp",
            username: "18a1829fad648fa0a576a7a7",
            credential: "HaZSE9Ihf0fxnzsX",
        };

        return NextResponse.json({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                turnServer,
                turnServerTls,
                turnServerUdp,
            ],
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch ICE servers" }, { status: 500 });
    }
}
