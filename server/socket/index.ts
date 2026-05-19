/**
 * Socket.io Server Setup
 * يتعامل مع إنشاء خادم Socket.io وربطه مع Nitro
 */
import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { registerRoomHandlers } from "./roomHandlers";
import { registerPresenceHandlers } from "./presenceHandlers";
import { registerPrivateHandlers } from "./privateHandlers";
import { configureSocketGateway, registerSocketConnection } from "./SocketGateway";
import { initializeSocketBroker } from "./SocketBroker";

let io: SocketIOServer | null = null;


/**
 * ينشئ ويهيئ خادم Socket.io
 */
export function createSocketServer(httpServer: HttpServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: "/ws",
    transports: ["websocket", "polling"],
    allowUpgrades: true,
    pingInterval: 20000,
    pingTimeout: 180000,
    maxHttpBufferSize: 1e6,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    perMessageDeflate: {
      threshold: 2000,
      zlibDeflateOptions: { chunkSize: 1024 * 16, level: 5 },
      zlibInflateOptions: { chunkSize: 1024 * 16 },
    },
  });

  configureSocketGateway(io, { shardId: process.env.SOCKET_SHARD_ID ?? "local" });
  initializeSocketBroker(io);

  io.on("connection", (socket) => {
    const username = socket.handshake.auth?.username || "زائر";
    const role = socket.handshake.auth?.role || "guest";
    const userId = socket.handshake.auth?.userId || socket.id;

    // حفظ بيانات المستخدم على الـ socket
    socket.data.user = {
      id: userId,
      username,
      role,
      avatar: socket.handshake.auth?.avatar || "/pic.png",
      countryCode: socket.handshake.auth?.countryCode || "SA",
      avatarFrameUrl: socket.handshake.auth?.avatarFrameUrl || "",
      giftIconUrl: socket.handshake.auth?.giftIconUrl || "",
      messageBubbleStyle: socket.handshake.auth?.messageBubbleStyle || "default",
      connectedAt: new Date().toISOString(),
    };

    // تسجيل أحداث الغرف
    registerSocketConnection(socket, { shardId: process.env.SOCKET_SHARD_ID ?? "local" });
    registerRoomHandlers(io!, socket);
    // تسجيل أحداث الحضور
    registerPresenceHandlers(io!, socket);
    // تسجيل أحداث الرسائل الخاصة
    registerPrivateHandlers(io!, socket);

    // إرسال تأكيد الاتصال
    socket.emit("connected", {
      socketId: socket.id,
      user: socket.data.user,
      serverTime: new Date().toISOString(),
    });

    socket.on("disconnect", () => {
      // سيتم التعامل مع هذا في presenceHandlers
    });
  });

  return io;
}

/**
 * يحصل على مثيل Socket.io الحالي
 */
export function getIO(): SocketIOServer | null {
  return io;
}
