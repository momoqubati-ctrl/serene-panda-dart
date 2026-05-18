import type { Socket } from "socket.io";

export const SOCKET_CHANNELS = {
  room: (roomId: string) => `room:${roomId}`,
  presence: (roomId: string) => `presence:${roomId}`,
  social: (userId: string) => `social:${userId}`,
  moderation: "moderators_alerts",
  notifications: (userId: string) => `notifications:${userId}`,
  admin: "admin:realtime",
};

export function joinUserChannels(socket: Socket): void {
  const userId = String(socket.data.user?.id ?? "");
  const role = String(socket.data.user?.role ?? "guest");
  if (userId) {
    socket.join(SOCKET_CHANNELS.social(userId));
    socket.join(SOCKET_CHANNELS.notifications(userId));
  }
  if (role === "admin" || role === "owner") {
    socket.join(SOCKET_CHANNELS.admin);
    socket.join(SOCKET_CHANNELS.moderation);
  }
}
