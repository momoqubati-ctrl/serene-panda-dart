/**
 * Socket.io Client Manager
 * يدير اتصال WebSocket من الواجهة الأمامية
 */
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * ينشئ أو يعيد اتصال Socket.io
 */
export function getSocket(): Socket {
  if (socket?.connected) return socket;

  // قراءة بيانات المستخدم من localStorage
  let auth: Record<string, string> = {};
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      auth = {
        userId: user.id || "",
        username: user.name || "زائر",
        role: user.role || "guest",
        avatar: user.avatar || "/pic.png",
        countryCode: user.countryCode || "SA",
        avatarFrameUrl: user.avatarFrameUrl || "",
        giftIconUrl: user.giftIconUrl || "",
        messageBubbleStyle: user.messageBubbleStyle || "default",
      };
    }
  } catch {
    // fallback لزائر
  }

  socket = io({
    path: "/ws",
    transports: ["websocket", "polling"],
    auth,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  return socket;
}

/**
 * يقطع الاتصال ويمسح المثيل
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * يتحقق هل الاتصال نشط
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
