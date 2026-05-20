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
  getRoomMemberCount,
  pendingDisconnects,
} from "./presenceManager";
import { publishGlobalEvent } from "./SocketBroker";

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
    status: user.status || "online",
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
        status: u.status || "online",
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
        status: socket.data.user.status || "online",
      });
    } catch (err) {
      console.error("Failed to update profile in Redis:", err);
    }
  });

  /**
   * تحديث حالة الاتصال (مثل متصل، مشغول، بعيد)
   */
  socket.on("status_update", async (data: any) => {
    const newStatus = String(data?.status || "online").trim();
    const validStatuses = ["online", "idle", "busy", "away"];
    if (!validStatuses.includes(newStatus)) return;

    socket.data.user.status = newStatus;

    try {
      await addConnectedUser(socket.id, {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar: socket.data.user.avatar || user.avatar,
        countryCode: user.countryCode,
        avatarFrameUrl: socket.data.user.avatarFrameUrl || "",
        giftIconUrl: socket.data.user.giftIconUrl || "",
        messageBubbleStyle: socket.data.user.messageBubbleStyle || "default",
        roomId: socket.data.user.roomId || "",
        connectedAt: user.connectedAt,
        status: newStatus as any,
      });
    } catch (err) {
      console.error("Failed to update status in Redis:", err);
    }

    io.emit("user_status_update", {
      socketId: socket.id,
      userId: user.id,
      username: user.username,
      role: user.role,
      status: newStatus,
      avatar: socket.data.user.avatar || user.avatar,
      countryCode: user.countryCode,
      roomId: socket.data.user.roomId || "",
    });
  });

  /**
   * عند قطع الاتصال
   */
  socket.on("disconnect", async () => {
    try {
      const roomId = socket.data.user.roomId;

      const executeDisconnectPresence = async () => {
        try {
          const removedUser = await removeConnectedUser(socket.id);
          const count = await getTotalOnlineCount();
          io.emit("online_count", { count });

          if (removedUser && removedUser.roomId) {
            const memberCount = await getRoomMemberCount(removedUser.roomId);
            await publishGlobalEvent("room_count_update", { roomId: removedUser.roomId, memberCount });
          }
        } catch (err) {
          console.error("Failed delayed disconnect in presenceHandlers:", err);
        }
      };

      if (roomId) {
        const userKey = user.username;
        const presenceTimeout = setTimeout(() => {
          executeDisconnectPresence();
        }, 3000);

        const existing = pendingDisconnects.get(userKey);
        if (existing) {
          existing.presenceTimeout = presenceTimeout;
        } else {
          pendingDisconnects.set(userKey, {
            roomId,
            timeout: setTimeout(() => {}, 3000), // dummy
            presenceTimeout,
            socketId: socket.id,
            userData: { ...user }
          });
        }
      } else {
        const removedUser = await removeConnectedUser(socket.id);
        const count = await getTotalOnlineCount();
        io.emit("online_count", { count });
      }
    } catch (err) {
      console.error("Failed to remove connected user on disconnect:", err);
    }
  });
}

