import type { types } from 'mediasoup';
export declare const config: {
    listenIp: string;
    listenPort: string | number;
    mediasoup: {
        numWorkers: number;
        workerSettings: {
            logLevel: string;
            logTags: string[];
            rtcMinPort: number;
            rtcMaxPort: number;
        };
        routerOptions: {
            mediaCodecs: types.RtpCodecCapability[];
        };
        webRtcTransportOptions: {
            listenIps: {
                ip: string;
                announcedIp: string;
            }[];
            initialAvailableOutgoingBitrate: number;
            minimumAvailableOutgoingBitrate: number;
            maxSctpMessageSize: number;
            maxIncomingBitrate: number;
        };
    };
};
//# sourceMappingURL=config.d.ts.map