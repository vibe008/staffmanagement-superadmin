
import { io, Socket } from 'socket.io-client';

const CHAT_URL = "http://localhost:5001";

export class SocketService {
  private static instance: SocketService;
  public socket: Socket | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  private constructor() { }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(staffId: string, chatToken: string) {
    if (this.socket?.connected) return;

    this.socket = io(CHAT_URL, {
      query: {
        userId: staffId,
        userType: "staff",
      },
      auth: { token: chatToken },
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket Connected:", this.socket?.id);
      this.socket?.emit("staff_online", { staffId });
      this.trigger("connect", null);
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Socket Disconnected");
      this.trigger("disconnect", null);
    });

    this.socket.on("connect_error", (err) => {
      console.error("❌ Socket Connection Error:", err.message);
      this.trigger("error", err);
    });

    // Forwarding specific chat events - added chatRemoved and chatEnded
    const events = ["myActiveChats", "chatAssigned", "newChatAssigned", "chatHistory", "receiveMessage", "chatRemoved", "chatEnded", "unreadCountUpdated"];
    events.forEach(event => {
      this.socket?.off(event);
      this.socket?.on(event, (data) => this.trigger(event, data));
    });
  }

  public disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.listeners.clear();
  }

  public emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  public on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  public off(event: string, callback: (data: any) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      this.listeners.set(event, eventListeners.filter(cb => cb !== callback));
    }
  }

  public removeAllListeners(event: string) {
    this.listeners.delete(event);
  }

  private trigger(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      [...eventListeners].forEach(callback => callback(data));
    }
  }
}

export const socketService = SocketService.getInstance();
