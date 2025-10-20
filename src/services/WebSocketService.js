import { io } from 'socket.io-client';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    connect(auth = {}, callback = () => {}) {
        if (this.isConnected) {
            callback();
            return;
        }
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        this.socket = io(baseURL, { transports: ['websocket'], auth });
        this.socket.on('connect', () => {
            this.isConnected = true;
            callback();
        });
        this.socket.on('disconnect', () => {
            this.isConnected = false;
        });
    }

    joinThread(threadId) {
        if (!this.socket) return;
        this.socket.emit('thread:join', { threadId });
    }

    onThreadMessage(handler) {
        if (!this.socket) return;
        this.socket.on('thread:new_message', handler);
    }

    onThreadRead(handler) {
        if (!this.socket) return;
        this.socket.on('thread:read', handler);
    }

    offThreadEvents() {
        if (!this.socket) return;
        this.socket.off('thread:new_message');
        this.socket.off('thread:read');
    }

    joinChannel(channelId) {
        if (!this.socket) return;
        this.socket.emit('channel:join', { channelId });
    }

    onChannelMessage(handler) {
        if (!this.socket) return;
        this.socket.on('channel:new_message', handler);
    }

    offChannelEvents() {
        if (!this.socket) return;
        this.socket.off('channel:new_message');
    }
}

export default new WebSocketService();