/**
 * Presence Handlers
 * يدير أحداث الحضور والحالة للمستخدمين
 */
import type { Server, Socket } from "socket.io";
import {
  addConnectedUser,
  removeConnectedUser,
  getAllOnlineUsers,
  getTotalOnlineCount,
} from "./presenceManager";

export function registerPresenceHandlers(io: Server, socket: Socket): void {
  const user = socket.data.user;

  // تسجيل المستخدم عند الاتصال
  addConnectedUser(socket.id, {
    id: user.id,
    username: user.username,
    role: user.role,
    avatar: user.avatar,
    countryCode: user.countryCode,
    avatarFrameUrl: user.avatarFrameUrl || "",
    giftIconUrl: user.giftIconUrl || "",
    messageBubbleStyle: user.messageBubbleStyle || "default",
    roomId: "",
    connectedAt: user.connectedAt,
  });

  // تحديث عدد المتصلين للجميع
  io.emit("online_count", { count: getTotalOnlineCount() });

  /**
   * طلب قائمة المتصلين
   */
  socket.on("get_online_users", (callback?: (res: any) => void) => {
    const users = getAllOnlineUsers().map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      avatar: u.avatar,
      countryCode: u.countryCode,
      avatarFrameUrl: u.avatarFrameUrl,
      giftIconUrl: u.giftIconUrl,
      roomId: u.roomId,
    }));
    callback?.({ success: true, users, count: users.length });
  });

  /**
   * تحديث بيانات المستخدم (مثل تغيير الأفاتار أو الحالة)
   */
  socket.on("update_profile", (data: Record<string, any>) => {
    if (!data || typeof data !== "object") return;

    const allowedKeys = ["avatar", "avatarFrameUrl", "giftIconUrl", "messageBubbleStyle"];
    for (const key of allowedKeys) {
      if (typeof data[key] === "string") {
        (socket.data.user as any)[key] = data[key].trim().slice(0, 255);
      }
    }
  });

  /**
   * عند قطع الاتصال
   */
  socket.on("disconnect", () => {
    removeConnectedUser(socket.id);
    io.emit("online_count", { count: getTotalOnlineCount() });
  });
}
