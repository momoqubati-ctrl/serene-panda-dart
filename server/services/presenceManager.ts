/**
 * Presence Manager
 * يدير حالة الحضور للمستخدمين المتصلين في كل غرفة مع دعم التخفي
 */
import { getUserContext } from "./permissionEngine";

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
  isStealth: boolean; // حالة التخفي
};

// المستخدمون المتصلون: socketId → بيانات المستخدم
const connectedUsers = new Map<string, OnlineUser>();

// أعضاء كل غرفة: roomId → Set<socketId>
const roomMembers = new Map<string, Set<string>>();

/**
 * يضيف مستخدم متصل مع التحقق من صلاحية التخفي
 */
export async function addConnectedUser(socketId: string, user: Omit<OnlineUser, "socketId" | "isStealth">): Promise<void> {
  const context = await getUserContext(user.id);
  const isStealth = context.permissions.has("stealth");
  
  connectedUsers.set(socketId, { ...user, socketId, isStealth });
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
 * يحصل على قائمة أعضاء غرفة معينة (مع فلترة المتخفين)
 */
export function getRoomMembers(roomId: string, viewerId?: string): OnlineUser[] {
  const memberIds = roomMembers.get(roomId);
  if (!memberIds) return [];

  const members: OnlineUser[] = [];
  for (const socketId of memberIds) {
    const user = connectedUsers.get(socketId);
    if (user) {
      // إذا كان المستخدم متخفياً، لا يظهر إلا لنفسه أو للإدارة العليا (سيتم تحسين هذا لاحقاً)
      if (user.isStealth && user.id !== viewerId) continue;
      members.push(user);
    }
  }
  return members;
}

/**
 * يحصل على عدد أعضاء غرفة (بدون المتخفين)
 */
export function getRoomMemberCount(roomId: string): number {
  const memberIds = roomMembers.get(roomId);
  if (!memberIds) return 0;
  
  let count = 0;
  for (const sid of memberIds) {
    if (!connectedUsers.get(sid)?.isStealth) count++;
  }
  return count;
}

/**
 * يحصل على كل المستخدمين المتصلين
 */
export function getAllOnlineUsers(): OnlineUser[] {
  return Array.from(connectedUsers.values());
}

/**
 * يحصل على عدد المتصلين الكلي (بدون المتخفين)
 */
export function getTotalOnlineCount(): number {
  let count = 0;
  for (const user of connectedUsers.values()) {
    if (!user.isStealth) count++;
  }
  return count;
}

/**
 * يحصل على بيانات مستخدم متصل بواسطة socketId
 */
export function getConnectedUser(socketId: string): OnlineUser | undefined {
  return connectedUsers.get(socketId);
}