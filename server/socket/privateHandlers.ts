/**
 * Private Message Handlers
 * يدير أحداث الرسائل الخاصة بين المستخدمين
 */
import type { Server, Socket } from "socket.io";

export function registerPrivateHandlers(io: Server, socket: Socket): void {
  const user = socket.data.user;

  /**
   * إرسال رسالة خاصة
   */
  socket.on("pm_message", (data: { toSocketId: string; text: string; clientId?: string }, callback?: (res: any) => void) => {
    const toSocketId = String(data?.toSocketId || "").trim();
    const text = String(data?.text || "").trim();

    if (!toSocketId || !text) {
      callback?.({ success: false, message: "بيانات الرسالة ناقصة" });
      return;
    }

    if (text.length > 1000) {
      callback?.({ success: false, message: "الرسالة طويلة جداً" });
      return;
    }

    const message = {
      id: crypto.randomUUID(),
      clientId: data.clientId,
      fromSocketId: socket.id,
      toSocketId,
      user: user.username,
      role: user.role,
      avatar: user.avatar,
      countryCode: user.countryCode,
      text,
      createdAt: new Date().toISOString(),
    };

    // إرسال للمستقبل
    io.to(toSocketId).emit("pm_message", message);

    // تأكيد للمرسل
    callback?.({ success: true, message });
  });

  /**
   * حالة الكتابة في الخاص
   */
  socket.on("pm_typing", (data: { toSocketId: string }) => {
    const toSocketId = String(data?.toSocketId || "").trim();
    if (!toSocketId) return;

    io.to(toSocketId).emit("pm_typing", {
      fromSocketId: socket.id,
      username: user.username,
    });
  });

  /**
   * التوقف عن الكتابة في الخاص
   */
  socket.on("pm_stop_typing", (data: { toSocketId: string }) => {
    const toSocketId = String(data?.toSocketId || "").trim();
    if (!toSocketId) return;

    io.to(toSocketId).emit("pm_stop_typing", {
      fromSocketId: socket.id,
      username: user.username,
    });
  });
}
