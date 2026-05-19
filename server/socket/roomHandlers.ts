/**
 * Room Handlers
 * يدير أحداث WebSocket المتعلقة بالغرف والرسائل مع دمج نظام الفلترة
 */
import type { Server, Socket } from "socket.io";
import { joinRoom, leaveRoom, getRoomMembers, getRoomMemberCount } from "./presenceManager";
import { publishSocketEvent } from "./SocketBroker";
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
  socket.on("join_room", async (data: { roomId: string }, callback?: (res: any) => void) => {
    const roomId = String(data?.roomId || "").trim();
    if (!roomId) {
      callback?.({ success: false, message: "معرف الغرفة مطلوب" });
      return;
    }

    const previousRoomId = socket.data.user.roomId;
    if (previousRoomId && previousRoomId !== roomId) {
      socket.leave(`room:${previousRoomId}`);
      await leaveRoom(socket.id);
      eventBus.publish({
        type: "room.left",
        stream: "rooms",
        actor: { id: user.id, username: user.username, role: user.role, socketId: socket.id, ip: socket.handshake.address },
        target: { id: previousRoomId, type: "room", roomId: previousRoomId },
        payload: { roomId: previousRoomId, username: user.username },
        metadata: { roomId: previousRoomId, source: "socket.roomHandlers", shardKey: previousRoomId },
      }).catch(err => console.error("EventBus publish failed (room.left):", err));

      const memberCount = await getRoomMemberCount(previousRoomId);
      await publishSocketEvent(previousRoomId, "user_left", {
        socketId: socket.id,
        username: user.username,
        roomId: previousRoomId,
        memberCount,
      });
    }

    socket.join(`room:${roomId}`);
    await joinRoom(socket.id, roomId);
    socket.data.user.roomId = roomId;

    eventBus.publish({
      type: "room.joined",
      stream: "rooms",
      actor: { id: user.id, username: user.username, role: user.role, socketId: socket.id, ip: socket.handshake.address },
      target: { id: roomId, type: "room", roomId },
      payload: { roomId, username: user.username },
      metadata: { roomId, source: "socket.roomHandlers", shardKey: roomId },
    }).catch(err => console.error("EventBus publish failed (room.joined):", err));

    const members = await getRoomMembers(roomId);
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

    await publishSocketEvent(roomId, "user_joined", {
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
    }, socket.id);
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

      await publishSocketEvent(roomId, "new_message", {
        roomId,
        message,
      });

      callback?.({ success: true, message });
    } catch (error) {
      console.error("room_message failed:", error);
      callback?.({ success: false, message: "تعذر إرسال الرسالة" });
    }
  });

  socket.on("typing", async (data: { roomId: string }) => {
    const roomId = String(data?.roomId || "").trim();
    if (!roomId) return;
    const key = `${socket.id}:${roomId}`;
    if (typingTimers.has(key)) return;
    typingTimers.set(key, setTimeout(() => typingTimers.delete(key), TYPING_THROTTLE_MS));
    await publishSocketEvent(roomId, "user_typing", { socketId: socket.id, username: user.username, roomId }, socket.id);
  });

  socket.on("stop_typing", async (data: { roomId: string }) => {
    const roomId = String(data?.roomId || "").trim();
    if (!roomId) return;
    await publishSocketEvent(roomId, "user_stop_typing", { socketId: socket.id, username: user.username, roomId }, socket.id);
  });

  socket.on("disconnect", async () => {
    const roomId = socket.data.user.roomId;
    if (roomId) {
      eventBus.publish({
        type: "room.left",
        stream: "rooms",
        actor: { id: user.id, username: user.username, role: user.role, socketId: socket.id, ip: socket.handshake.address },
        target: { id: roomId, type: "room", roomId },
        payload: { roomId, username: user.username, disconnected: true },
        metadata: { roomId, source: "socket.roomHandlers.disconnect", shardKey: roomId },
      }).catch(err => console.error("EventBus publish failed (room.left on disconnect):", err));

      const memberCount = await getRoomMemberCount(roomId);
      await publishSocketEvent(roomId, "user_left", {
        socketId: socket.id,
        username: user.username,
        roomId,
        memberCount: Math.max(0, memberCount),
      });
    }
  });
}

