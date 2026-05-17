/**
 * Presence Manager
 * يدير حالة الحضور للمستخدمين المتصلين في كل غرفة
 */

export type OnlineUser = {
  id: string;
  socketId: string;
  username: string;
  role: string;
  avatar: string;
  countryCode: string;
  avatarFrameUrl: string;
  giftIconUrl: string;
  messageBubbleStyle: string;
  roomId: string;
  connectedAt: string;
};

// المستخدمون المتصلون: socketId → بيانات المستخدم
const connectedUsers = new Map<string, OnlineUser>();

// أعضاء كل غرفة: roomId → Set<socketId>
const roomMembers = new Map<string, Set<string>>();

/**
 * يضيف مستخدم متصل
 */
export function addConnectedUser(socketId: string, user: Omit<OnlineUser, "socketId">): void {
  connectedUsers.set(socketId, { ...user, socketId });
}

/**
 * يزيل مستخدم عند قطع الاتصال
 */
export function removeConnectedUser(socketId: string): OnlineUser | undefined {
  const user = connectedUsers.get(socketId);
  if (user) {
    connectedUsers.delete(socketId);
    // إزالته من الغرفة
    if (user.roomId) {
      const members = roomMembers.get(user.roomId);
      if (members) {
        members.delete(socketId);
        if (members.size === 0) {
          roomMembers.delete(user.roomId);
        }
      }
    }
  }
  return user;
}

/**
 * يضيف مستخدم لغرفة معينة
 */
export function joinRoom(socketId: string, roomId: string): void {
  const user = connectedUsers.get(socketId);
  if (!user) return;

  // إزالة من الغرفة السابقة
  if (user.roomId && user.roomId !== roomId) {
    leaveRoom(socketId);
  }

  user.roomId = roomId;

  if (!roomMembers.has(roomId)) {
    roomMembers.set(roomId, new Set());
  }
  roomMembers.get(roomId)!.add(socketId);
}

/**
 * يزيل مستخدم من غرفته الحالية
 */
export function leaveRoom(socketId: string): string | undefined {
  const user = connectedUsers.get(socketId);
  if (!user || !user.roomId) return undefined;

  const roomId = user.roomId;
  const members = roomMembers.get(roomId);
  if (members) {
    members.delete(socketId);
    if (members.size === 0) {
      roomMembers.delete(roomId);
    }
  }

  user.roomId = "";
  return roomId;
}

/**
 * يحصل على قائمة أعضاء غرفة معينة
 */
export function getRoomMembers(roomId: string): OnlineUser[] {
  const memberIds = roomMembers.get(roomId);
  if (!memberIds) return [];

  const members: OnlineUser[] = [];
  for (const socketId of memberIds) {
    const user = connectedUsers.get(socketId);
    if (user) {
      members.push(user);
    }
  }
  return members;
}

/**
 * يحصل على عدد أعضاء غرفة
 */
export function getRoomMemberCount(roomId: string): number {
  return roomMembers.get(roomId)?.size ?? 0;
}

/**
 * يحصل على كل المستخدمين المتصلين
 */
export function getAllOnlineUsers(): OnlineUser[] {
  return Array.from(connectedUsers.values());
}

/**
 * يحصل على عدد المتصلين الكلي
 */
export function getTotalOnlineCount(): number {
  return connectedUsers.size;
}

/**
 * يحصل على بيانات مستخدم متصل بواسطة socketId
 */
export function getConnectedUser(socketId: string): OnlineUser | undefined {
  return connectedUsers.get(socketId);
}
