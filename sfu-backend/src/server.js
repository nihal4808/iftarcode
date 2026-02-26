import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import * as mediasoup from 'mediasoup';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './config.js';
dotenv.config();
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Adjust for production
        methods: ['GET', 'POST'],
    },
});
// -- Mediasoup Globals --
let workers = [];
let nextMediasoupWorkerIdx = 0;
const rooms = new Map();
// -- Initialize Mediasoup Workers --
async function createWorkers() {
    const { numWorkers } = config.mediasoup;
    console.log(`Starting ${numWorkers} mediasoup workers...`);
    for (let i = 0; i < numWorkers; i++) {
        const worker = await mediasoup.createWorker({
            logLevel: config.mediasoup.workerSettings.logLevel,
            logTags: config.mediasoup.workerSettings.logTags,
            rtcMinPort: config.mediasoup.workerSettings.rtcMinPort,
            rtcMaxPort: config.mediasoup.workerSettings.rtcMaxPort,
        });
        worker.on('died', () => {
            console.error(`mediasoup worker died, exiting in 2 seconds... [pid:${worker.pid}]`);
            setTimeout(() => process.exit(1), 2000);
        });
        workers.push(worker);
    }
}
function getMediasoupWorker() {
    const worker = workers[nextMediasoupWorkerIdx];
    if (!worker) {
        throw new Error('No mediasoup workers available');
    }
    if (++nextMediasoupWorkerIdx === workers.length) {
        nextMediasoupWorkerIdx = 0;
    }
    return worker;
}
// -- Room Management --
async function getOrCreateRoom(roomId) {
    let room = rooms.get(roomId);
    if (!room) {
        const worker = getMediasoupWorker();
        const router = await worker.createRouter({ mediaCodecs: config.mediasoup.routerOptions.mediaCodecs });
        room = {
            id: roomId,
            router,
            peers: new Map(),
        };
        rooms.set(roomId, room);
        console.log(`Created room ${roomId}`);
    }
    return room;
}
// -- Helpers to map Transports --
async function createWebRtcTransport(router) {
    return new Promise(async (resolve, reject) => {
        try {
            const transport = await router.createWebRtcTransport({
                listenIps: config.mediasoup.webRtcTransportOptions.listenIps,
                enableUdp: true,
                enableTcp: true,
                preferUdp: true,
                initialAvailableOutgoingBitrate: config.mediasoup.webRtcTransportOptions.initialAvailableOutgoingBitrate,
            });
            transport.on('dtlsstatechange', (dtlsState) => {
                if (dtlsState === 'closed') {
                    transport.close();
                }
            });
            transport.on('routerclose', () => {
                console.log('transport closed due to router close');
            });
            resolve(transport);
        }
        catch (error) {
            reject(error);
        }
    });
}
// -- Socket.IO Signaling --
io.on('connection', (socket) => {
    let peerId = socket.id;
    let currentRoomId = null;
    console.log(`Socket connected: ${socket.id}`);
    const emitToRoom = (event, data, excludePeerId) => {
        if (!currentRoomId)
            return;
        const room = rooms.get(currentRoomId);
        if (!room)
            return;
        room.peers.forEach((peer) => {
            if (peer.id !== excludePeerId) {
                peer.socket.emit(event, data);
            }
        });
    };
    socket.on('joinRoom', async ({ roomId, userName }, callback) => {
        console.log(`User ${userName} joining room ${roomId}`);
        const room = await getOrCreateRoom(roomId);
        currentRoomId = roomId;
        const peer = {
            id: peerId,
            socket,
            name: userName,
            transports: new Map(),
            producers: new Map(),
            consumers: new Map(),
        };
        room.peers.set(peerId, peer);
        callback({
            rtpCapabilities: room.router.rtpCapabilities,
            peerId,
        });
        // Notify others
        emitToRoom('newPeer', { peerId, peerName: userName }, peerId);
    });
    socket.on('getRouterRtpCapabilities', (data, callback) => {
        if (!currentRoomId)
            return callback({ error: 'Not in a room' });
        const room = rooms.get(currentRoomId);
        if (!room)
            return callback({ error: 'Room not found' });
        callback(room.router.rtpCapabilities);
    });
    socket.on('createWebRtcTransport', async ({ sender }, callback) => {
        if (!currentRoomId)
            return callback({ error: 'Not in a room' });
        const room = rooms.get(currentRoomId);
        if (!room)
            return callback({ error: 'Room not found' });
        const peer = room.peers.get(peerId);
        if (!peer)
            return callback({ error: 'Peer not found' });
        try {
            const transport = await createWebRtcTransport(room.router);
            peer.transports.set(transport.id, transport);
            callback({
                params: {
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                }
            });
        }
        catch (err) {
            console.error(err);
            callback({ error: err.message });
        }
    });
    socket.on('connectTransport', async ({ transportId, dtlsParameters }, callback) => {
        if (!currentRoomId)
            return callback({ error: 'Not in a room' });
        const room = rooms.get(currentRoomId);
        const peer = room?.peers.get(peerId);
        if (!peer)
            return callback({ error: 'Peer not found' });
        const transport = peer.transports.get(transportId);
        if (!transport)
            return callback({ error: 'Transport not found' });
        try {
            await transport.connect({ dtlsParameters });
            callback({ success: true });
        }
        catch (err) {
            callback({ error: err.message });
        }
    });
    socket.on('produce', async ({ transportId, kind, rtpParameters, appData }, callback) => {
        if (!currentRoomId)
            return callback({ error: 'Not in a room' });
        const room = rooms.get(currentRoomId);
        const peer = room?.peers.get(peerId);
        if (!peer)
            return callback({ error: 'Peer not found' });
        const transport = peer.transports.get(transportId);
        if (!transport)
            return callback({ error: 'Transport not found' });
        try {
            const producer = await transport.produce({
                kind,
                rtpParameters,
                appData, // e.g. { mediaTag: 'cam' }
            });
            peer.producers.set(producer.id, producer);
            producer.on('transportclose', () => {
                producer.close();
                peer.producers.delete(producer.id);
            });
            callback({ id: producer.id });
            // Notify others about new producer
            emitToRoom('newProducer', {
                producerId: producer.id,
                peerId: peer.id,
                peerName: peer.name,
                kind: producer.kind
            }, peer.id);
        }
        catch (err) {
            callback({ error: err.message });
        }
    });
    socket.on('consume', async ({ rtpCapabilities, remoteProducerId, serverConsumerTransportId }, callback) => {
        if (!currentRoomId)
            return callback({ error: 'Not in a room' });
        const room = rooms.get(currentRoomId);
        if (!room)
            return callback({ error: 'Room not found' });
        const peer = room.peers.get(peerId);
        if (!peer)
            return callback({ error: 'Peer not found' });
        const transport = peer.transports.get(serverConsumerTransportId);
        if (!transport)
            return callback({ error: 'Consumer transport not found' });
        try {
            if (!room.router.canConsume({ producerId: remoteProducerId, rtpCapabilities })) {
                return callback({ error: 'Cannot consume' });
            }
            const consumer = await transport.consume({
                producerId: remoteProducerId,
                rtpCapabilities,
                paused: true, // MUST start paused
            });
            peer.consumers.set(consumer.id, consumer);
            consumer.on('transportclose', () => {
                peer.consumers.delete(consumer.id);
            });
            consumer.on('producerclose', () => {
                peer.consumers.delete(consumer.id);
                socket.emit('consumerClosed', { consumerId: consumer.id });
            });
            callback({
                params: {
                    id: consumer.id,
                    producerId: remoteProducerId,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                }
            });
        }
        catch (err) {
            callback({ error: err.message });
        }
    });
    socket.on('resumeConsumer', async ({ consumerId }, callback) => {
        if (!currentRoomId)
            return callback({ error: 'Not in a room' });
        const room = rooms.get(currentRoomId);
        const peer = room?.peers.get(peerId);
        if (!peer)
            return callback({ error: 'Peer not found' });
        const consumer = peer.consumers.get(consumerId);
        if (!consumer)
            return callback({ error: 'Consumer not found' });
        try {
            await consumer.resume();
            callback({ success: true });
        }
        catch (err) {
            callback({ error: err.message });
        }
    });
    socket.on('getProducers', (data, callback) => {
        if (!currentRoomId)
            return callback([]);
        const room = rooms.get(currentRoomId);
        if (!room)
            return callback([]);
        const producerList = [];
        room.peers.forEach((p) => {
            if (p.id !== peerId) {
                p.producers.forEach((producer) => {
                    producerList.push({
                        producerId: producer.id,
                        peerId: p.id,
                        peerName: p.name,
                        kind: producer.kind
                    });
                });
            }
        });
        callback(producerList);
    });
    const removePeer = () => {
        if (!currentRoomId)
            return;
        const room = rooms.get(currentRoomId);
        if (!room)
            return;
        const peer = room.peers.get(peerId);
        if (peer) {
            // Close all transports (this closes associated producers and consumers as well)
            peer.transports.forEach(t => t.close());
            room.peers.delete(peerId);
            emitToRoom('peerLeft', { peerId }, peerId);
            console.log(`Peer ${peerId} left room ${currentRoomId}`);
            if (room.peers.size === 0) {
                rooms.delete(currentRoomId);
                console.log(`Room ${currentRoomId} deleted`);
            }
        }
    };
    socket.on('leaveRoom', () => {
        removePeer();
        currentRoomId = null;
    });
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        removePeer();
    });
});
// -- Start Server --
async function start() {
    await createWorkers();
    const port = config.listenPort;
    server.listen(port, () => {
        console.log(`SFU Server running on port ${port}`);
    });
}
start();
//# sourceMappingURL=server.js.map