/**
 * Room Handlers
 * يدير أحداث WebSocket المتعلقة بالغرف والرسائل
 */
import type { Server, Socket } from "socket.io";
import { joinRoom, leaveRoom, getRoomMembers, getRoomMemberCount, getConnectedUser } from "./presenceManager";
import { listRooms, addMessage, listMessages } from "../services/chatStore";

const TYPING_THROTTLE_MS = 900;
const typingTimers = new Map<string, NodeJS.Timeout>();

export function registerRoomHandlers(io: Server, socket: Socket): void {
  const user = socket.data.user;

  /**
   * دخول غرفة
   */
  socket.on("join_room", (data: { roomId: string }, callback?: (res: any) => void) => {
    const roomId = String(data?.roomId || "").trim();
    if (!roomId) {
      callback?.({ success: false, message: "معرف الغرفة مطلوب" });
      return;
    }

    // مغادرة الغرفة السابقة
    const previousRoomId = getConnectedUser(socket.id)?.roomId;
    if (previousRoomId && previousRoomId !== roomId) {
      socket.leave(`room:${previousRoomId}`);
      leaveRoom(socket.id);
      io.to(`room:${previousRoomId}`).emit("user_left", {
        socketId: socket.id,
        username: user.username,
        roomId: previousRoomId,
        memberCount: getRoomMemberCount(previousRoomId),
      });
    }

    // الانضمام للغرفة الجديدة
    socket.join(`room:${roomId}`);
    joinRoom(socket.id, roomId);

    const members = getRoomMembers(roomId);

    // إرسال الرسائل الحالية + الأعضاء
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

    // إبلاغ بقية الأعضاء بانضمام مستخدم جديد
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

    // رسالة نظام ترحيبية
    const rooms = listRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      socket.emit("system_message", {
        type: "welcome",
        text: `مرحباً بك في ${room.name}`,
        roomId,
      });
    }
  });

  /**
   * مغادرة غرفة
   */
  socket.on("leave_room", (data: { roomId: string }) => {
    const roomId = String(data?.roomId || "").trim();
    if (!roomId) return;

    socket.leave(`room:${roomId}`);
    leaveRoom(socket.id);

    io.to(`room:${roomId}`).emit("user_left", {
      socketId: socket.id,
      username: user.username,
      roomId,
      memberCount: getRoomMemberCount(roomId),
    });
  });

  /**
   * إرسال رسالة في غرفة
   */
  socket.on("room_message", (data: { roomId: string; text: string; clientId?: string }, callback?: (res: any) => void) => {
    const roomId = String(data?.roomId || "").trim();
    const text = String(data?.text || "").trim();
    const clientId = data?.clientId;

    if (!roomId) {
      callback?.({ success: false, message: "معرف الغرفة مطلوب" });
      return;
    }

    if (!text) {
      callback?.({ success: false, message: "نص الرسالة مطلوب" });
      return;
    }

    if (text.length > 1000) {
      callback?.({ success: false, message: "الرسالة طويلة جداً" });
      return;
    }

    // إنشاء وحفظ الرسالة
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
      text,
    });

    // بث الرسالة لكل أعضاء الغرفة (بما فيهم المرسل)
    io.to(`room:${roomId}`).emit("new_message", {
      roomId,
      message,
    });

    // تأكيد للمرسل
    callback?.({ success: true, message });
  });

  /**
   * حالة الكتابة
   */
  socket.on("typing", (data: { roomId: string }) => {
    const roomId = String(data?.roomId || "").trim();
    if (!roomId) return;

    // Throttle الكتابة
    const key = `${socket.id}:${roomId}`;
    if (typingTimers.has(key)) return;

    typingTimers.set(
      key,
      setTimeout(() => {
        typingTimers.delete(key);
      }, TYPING_THROTTLE_MS),
    );

    socket.to(`room:${roomId}`).emit("user_typing", {
      socketId: socket.id,
      username: user.username,
      roomId,
    });
  });

  /**
   * التوقف عن الكتابة
   */
  socket.on("stop_typing", (data: { roomId: string }) => {
    const roomId = String(data?.roomId || "").trim();
    if (!roomId) return;

    socket.to(`room:${roomId}`).emit("user_stop_typing", {
      socketId: socket.id,
      username: user.username,
      roomId,
    });
  });

  /**
   * طلب قائمة الغرف
   */
  socket.on("get_rooms", (callback?: (res: any) => void) => {
    const rooms = listRooms().map((room) => ({
      ...room,
      members: getRoomMemberCount(room.id),
    }));
    callback?.({ success: true, rooms });
  });

  /**
   * عند قطع الاتصال
   */
  socket.on("disconnect", () => {
    const currentUser = getConnectedUser(socket.id);
    if (currentUser?.roomId) {
      io.to(`room:${currentUser.roomId}`).emit("user_left", {
        socketId: socket.id,
        username: user.username,
        roomId: currentUser.roomId,
        memberCount: Math.max(0, getRoomMemberCount(currentUser.roomId) - 1),
      });
    }
    // تنظيف typing timers
    for (const [key, timer] of typingTimers) {
      if (key.startsWith(`${socket.id}:`)) {
        clearTimeout(timer);
        typingTimers.delete(key);
      }
    }
  });
}
