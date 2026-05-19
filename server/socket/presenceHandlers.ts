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
  }).then(async () => {
    // تحديث عدد المتصلين للجميع
    const count = await getTotalOnlineCount();
    io.emit("online_count", { count });
  }).catch(err => {
    console.error("Failed to add connected user to presence:", err);
  });

  /**
   * طلب قائمة المتصلين
   */
  socket.on("get_online_users", async (callback?: (res: any) => void) => {
    try {
      const onlineUsers = await getAllOnlineUsers();
      const users = onlineUsers.map((u) => ({
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
    } catch (err) {
      console.error("Failed to get online users:", err);
      callback?.({ success: false, message: "تعذر جلب قائمة المتصلين" });
    }
  });

  /**
   * تحديث بيانات المستخدم (مثل تغيير الأفاتار أو الحالة)
   */
  socket.on("update_profile", async (data: Record<string, any>) => {
    if (!data || typeof data !== "object") return;

    const allowedKeys = ["avatar", "avatarFrameUrl", "giftIconUrl", "messageBubbleStyle"];
    for (const key of allowedKeys) {
      if (typeof data[key] === "string") {
        (socket.data.user as any)[key] = data[key].trim().slice(0, 255);
      }
    }

    // تحديث البيانات في كاش الحضور بـ Redis
    try {
      await addConnectedUser(socket.id, {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar: socket.data.user.avatar,
        countryCode: user.countryCode,
        avatarFrameUrl: socket.data.user.avatarFrameUrl || "",
        giftIconUrl: socket.data.user.giftIconUrl || "",
        messageBubbleStyle: socket.data.user.messageBubbleStyle || "default",
        roomId: socket.data.user.roomId || "",
        connectedAt: user.connectedAt,
      });
    } catch (err) {
      console.error("Failed to update profile in Redis:", err);
    }
  });

  /**
   * عند قطع الاتصال
   */
  socket.on("disconnect", async () => {
    try {
      await removeConnectedUser(socket.id);
      const count = await getTotalOnlineCount();
      io.emit("online_count", { count });
    } catch (err) {
      console.error("Failed to remove connected user on disconnect:", err);
    }
  });
}

