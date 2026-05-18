/**
 * Room Handlers
 * يدير أحداث WebSocket المتعلقة بالغرف والرسائل مع دمج نظام الفلترة
 */
import type { Server, Socket } from "socket.io";
import { joinRoom, leaveRoom, getRoomMembers, getRoomMemberCount, getConnectedUser } from "./presenceManager";
import { listRooms, addMessage, listMessages } from "../services/chatStore";
import { processText } from "../services/filterService";
import { eventBus } from "../core/events/EventBus";
import { bootstrapWorkers } from "../workers";

const TYPING_THROTTLE_MS = 900;
const typingTimers = new Map<string, NodeJS.Timeout>();

export function registerRoomHandlers(io: Server, socket: Socket): void {
  const user = socket.data.user;
  bootstrapWorkers();

  // الانضمام لغرفة تنبيهات المشرفين إذا كان يملك الصلاحية
  if (user.role === 'admin' || user.role === 'owner') {
    socket.join("moderators_alerts");
  }

  /**
   * دخول غرفة
   */
  socket.on("join_room", (data: { roomId: string }, callback?: (res: any) => void) => {
    const roomId = String(data?.roomId || "").trim();
    if (!roomId) {
      callback?.({ success: false, message: "معرف الغرفة مطلوب" });
      return;
    }

    const previousRoomId = getConnectedUser(socket.id)?.roomId;
    if (previousRoomId && previousRoomId !== roomId) {
      socket.leave(`room:${previousRoomId}`);
      leaveRoom(socket.id);
      void eventBus.publish({
        type: "room.left",
        stream: "rooms",
        actor: { id: user.id, username: user.username, role: user.role, socketId: socket.id, ip: socket.handshake.address },
        target: { id: previousRoomId, type: "room", roomId: previousRoomId },
        payload: { roomId: previousRoomId, username: user.username },
        metadata: { roomId: previousRoomId, source: "socket.roomHandlers", shardKey: previousRoomId },
      });
      io.to(`room:${previousRoomId}`).emit("user_left", {
        socketId: socket.id,
        username: user.username,
        roomId: previousRoomId,
        memberCount: getRoomMemberCount(previousRoomId),
      });
    }

    socket.join(`room:${roomId}`);
    joinRoom(socket.id, roomId);
    void eventBus.publish({
      type: "room.joined",
      stream: "rooms",
      actor: { id: user.id, username: user.username, role: user.role, socketId: socket.id, ip: socket.handshake.address },
      target: { id: roomId, type: "room", roomId },
      payload: { roomId, username: user.username },
      metadata: { roomId, source: "socket.roomHandlers", shardKey: roomId },
    });

    const members = getRoomMembers(roomId);
    const messages = listMessages(roomId);

    callback?.({
      success: true,
      roomId,
      messages,
      members: members.map((m) => ({
        id: m.id,
        username: m.username,
        role: m.role,
        avatar: m.avatar,
        countryCode: m.countryCode,
        avatarFrameUrl: m.avatarFrameUrl,
        giftIconUrl: m.giftIconUrl,
      })),
      memberCount: members.length,
    });

    socket.to(`room:${roomId}`).emit("user_joined", {
      socketId: socket.id,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        countryCode: user.countryCode,
        avatarFrameUrl: user.avatarFrameUrl,
        giftIconUrl: user.giftIconUrl,
      },
      memberCount: members.length,
    });
  });

  /**
   * إرسال رسالة في غرفة (مع الفلترة)
   */
  socket.on("room_message", async (data: { roomId: string; text: string; clientId?: string }, callback?: (res: any) => void) => {
    try {
      const roomId = String(data?.roomId || "").trim();
      const text = String(data?.text || "").trim();
      const clientId = data?.clientId;

      if (!roomId || !text) {
        callback?.({ success: false, message: "البيانات ناقصة" });
        return;
      }

      // --- تطبيق الفلترة الذكية ---
      const filterResult = await processText({
        text,
        source: roomId,
        user: {
          username: user.username,
          topic: user.username,
          ip: socket.handshake.address || "127.0.0.1",
        },
      });

      // إنشاء وحفظ الرسالة (باستخدام النص المفلتر)
      const message = addMessage({
        roomId,
        clientId,
        user: user.username,
        role: user.role,
        countryCode: user.countryCode,
        avatar: user.avatar,
        avatarFrameUrl: user.avatarFrameUrl,
        giftIconUrl: user.giftIconUrl,
        messageBubbleStyle: user.messageBubbleStyle,
        text: filterResult.filteredText,
      });

      io.to(`room:${roomId}`).emit("new_message", {
        roomId,
        message,
      });

      callback?.({ success: true, message });
    } catch (error) {
      console.error("room_message failed:", error);
      callback?.({ success: false, message: "تعذر إرسال الرسالة" });
    }
  });

  socket.on("typing", (data: { roomId: string }) => {
    const roomId = String(data?.roomId || "").trim();
    if (!roomId) return;
    const key = `${socket.id}:${roomId}`;
    if (typingTimers.has(key)) return;
    typingTimers.set(key, setTimeout(() => typingTimers.delete(key), TYPING_THROTTLE_MS));
    socket.to(`room:${roomId}`).emit("user_typing", { socketId: socket.id, username: user.username, roomId });
  });

  socket.on("stop_typing", (data: { roomId: string }) => {
    const roomId = String(data?.roomId || "").trim();
    if (!roomId) return;
    socket.to(`room:${roomId}`).emit("user_stop_typing", { socketId: socket.id, username: user.username, roomId });
  });

  socket.on("disconnect", () => {
    const currentUser = getConnectedUser(socket.id);
    if (currentUser?.roomId) {
      void eventBus.publish({
        type: "room.left",
        stream: "rooms",
        actor: { id: user.id, username: user.username, role: user.role, socketId: socket.id, ip: socket.handshake.address },
        target: { id: currentUser.roomId, type: "room", roomId: currentUser.roomId },
        payload: { roomId: currentUser.roomId, username: user.username, disconnected: true },
        metadata: { roomId: currentUser.roomId, source: "socket.roomHandlers.disconnect", shardKey: currentUser.roomId },
      });
      io.to(`room:${currentUser.roomId}`).emit("user_left", {
        socketId: socket.id,
        username: user.username,
        roomId: currentUser.roomId,
        memberCount: Math.max(0, getRoomMemberCount(currentUser.roomId) - 1),
      });
    }
  });
}
