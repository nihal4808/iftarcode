import type { types } from 'mediasoup';
import os from 'os';

export const config = {
    // http server settings
    listenIp: '0.0.0.0',
    listenPort: process.env.PORT || 4000,

    // mediasoup settings
    mediasoup: {
        // Number of mediasoup workers to launch.
        numWorkers: Object.keys(os.cpus()).length,
        // mediasoup Worker settings.
        workerSettings: {
            logLevel: 'warn',
            logTags: [
                'info',
                'ice',
                'dtls',
                'rtp',
                'srtp',
                'rtcp',
            ],
            rtcMinPort: 10000,
            rtcMaxPort: 10100,
        },
        // mediasoup Router settings.
        routerOptions: {
            mediaCodecs: ([
                {
                    kind: 'audio',
                    mimeType: 'audio/opus',
                    clockRate: 48000,
                    channels: 2,
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP8',
                    clockRate: 90000,
                    parameters: {
                        'x-google-start-bitrate': 1000,
                    },
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP9',
                    clockRate: 90000,
                    parameters: {
                        'profile-id': 2,
                        'x-google-start-bitrate': 1000,
                    },
                },
                {
                    kind: 'video',
                    mimeType: 'video/h264',
                    clockRate: 90000,
                    parameters: {
                        'packetization-mode': 1,
                        'profile-level-id': '4d0032',
                        'level-asymmetry-allowed': 1,
                        'x-google-start-bitrate': 1000,
                    },
                },
                {
                    kind: 'video',
                    mimeType: 'video/h264',
                    clockRate: 90000,
                    parameters: {
                        'packetization-mode': 1,
                        'profile-level-id': '42e01f',
                        'level-asymmetry-allowed': 1,
                        'x-google-start-bitrate': 1000,
                    },
                },
            ] as unknown) as types.RtpCodecCapability[],
        },
        // mediasoup WebRtcTransport settings.
        webRtcTransportOptions: {
            listenIps: [
                {
                    ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
                    announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1', // IMPORTANT: CHANGE FOR PRODUCTION
                },
            ],
            initialAvailableOutgoingBitrate: 1000000,
            minimumAvailableOutgoingBitrate: 600000,
            maxSctpMessageSize: 262144,
            // Additional options
            maxIncomingBitrate: 1500000,
        },
    },
};
