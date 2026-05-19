/**
 * Presence Manager (Stateless using Redis)
 * يدير حالة الحضور للمستخدمين المتصلين في كل غرفة عبر Redis
 */
import { redis } from "../services/redis";

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

// مفاتيح Redis
const getSocketKey = (socketId: string) => `socket:presence:${socketId}`;
const getRoomKey = (roomId: string) => `room:members:${roomId}`;
const ONLINE_SOCKETS_KEY = "online:sockets";

function getPresenceIdentity(user: Pick<OnlineUser, "id" | "username" | "role">): string {
  const id = String(user.id || "").trim();
  if (id && id !== "0") return `id:${id}`;

  const username = String(user.username || "").trim().toLowerCase();
  if (username && user.role !== "guest") return `username:${username}`;

  return "";
}

async function getDedupedOnlineUsers(): Promise<OnlineUser[]> {
  const socketIds = await redis.smembers(ONLINE_SOCKETS_KEY);
  if (socketIds.length === 0) return [];

  const usersPromises = socketIds.map((sid) => getConnectedUser(sid));
  const users = (await Promise.all(usersPromises)).filter((u): u is OnlineUser => u !== undefined);

  const byIdentity = new Map<string, OnlineUser>();
  const guests: OnlineUser[] = [];

  for (const user of users) {
    const identity = getPresenceIdentity(user);
    if (!identity) {
      guests.push(user);
      continue;
    }

    const existing = byIdentity.get(identity);
    if (!existing || new Date(user.connectedAt).getTime() > new Date(existing.connectedAt).getTime()) {
      byIdentity.set(identity, user);
    }
  }

  return [...byIdentity.values(), ...guests];
}

/**
 * يضيف مستخدم متصل
 */
export async function addConnectedUser(socketId: string, user: Omit<OnlineUser, "socketId">): Promise<void> {
  const key = getSocketKey(socketId);
  const data = {
    id: String(user.id),
    username: String(user.username),
    role: String(user.role),
    avatar: String(user.avatar),
    countryCode: String(user.countryCode),
    avatarFrameUrl: String(user.avatarFrameUrl),
    giftIconUrl: String(user.giftIconUrl),
    messageBubbleStyle: String(user.messageBubbleStyle),
    roomId: String(user.roomId),
    connectedAt: String(user.connectedAt),
  };

  await redis.hset(key, data);
  await redis.expire(key, 86400); // 24 ساعة كحد أقصى للسلامة العامة
  await redis.sadd(ONLINE_SOCKETS_KEY, socketId);
}

/**
 * يزيل مستخدم عند قطع الاتصال
 */
export async function removeConnectedUser(socketId: string): Promise<OnlineUser | undefined> {
  const user = await getConnectedUser(socketId);
  if (user) {
    await redis.del(getSocketKey(socketId));
    await redis.srem(ONLINE_SOCKETS_KEY, socketId);
    if (user.roomId) {
      await redis.srem(getRoomKey(user.roomId), socketId);
    }
  }
  return user;
}

/**
 * يضيف مستخدم لغرفة معينة
 */
export async function joinRoom(socketId: string, roomId: string): Promise<void> {
  const user = await getConnectedUser(socketId);
  if (!user) return;

  // إزالة من الغرفة السابقة
  if (user.roomId && user.roomId !== roomId) {
    await leaveRoom(socketId);
  }

  await redis.hset(getSocketKey(socketId), "roomId", roomId);
  await redis.sadd(getRoomKey(roomId), socketId);
}

/**
 * يزيل مستخدم من غرفته الحالية
 */
export async function leaveRoom(socketId: string): Promise<string | undefined> {
  const user = await getConnectedUser(socketId);
  if (!user || !user.roomId) return undefined;

  const roomId = user.roomId;
  await redis.srem(getRoomKey(roomId), socketId);
  await redis.hset(getSocketKey(socketId), "roomId", "");

  return roomId;
}

/**
 * يحصل على قائمة أعضاء غرفة معينة
 */
export async function getRoomMembers(roomId: string): Promise<OnlineUser[]> {
  const socketIds = await redis.smembers(getRoomKey(roomId));
  if (socketIds.length === 0) return [];

  const usersPromises = socketIds.map((sid) => getConnectedUser(sid));
  return (await Promise.all(usersPromises)).filter((u): u is OnlineUser => u !== undefined);
}

/**
 * يحصل على عدد أعضاء غرفة
 */
export async function getRoomMemberCount(roomId: string): Promise<number> {
  return await redis.scard(getRoomKey(roomId));
}

/**
 * يحصل على كل المستخدمين المتصلين
 */
export async function getAllOnlineUsers(): Promise<OnlineUser[]> {
  return await getDedupedOnlineUsers();
}

/**
 * يحصل على عدد المتصلين الكلي
 */
export async function getTotalOnlineCount(): Promise<number> {
  const deduped = await getDedupedOnlineUsers();
  return deduped.length;
}

/**
 * يحصل على بيانات مستخدم متصل بواسطة socketId
 */
export async function getConnectedUser(socketId: string): Promise<OnlineUser | undefined> {
  const data = await redis.hgetall(getSocketKey(socketId));
  if (!data || Object.keys(data).length === 0) return undefined;
  return {
    id: data.id,
    socketId,
    username: data.username,
    role: data.role,
    avatar: data.avatar,
    countryCode: data.countryCode,
    avatarFrameUrl: data.avatarFrameUrl,
    giftIconUrl: data.giftIconUrl,
    messageBubbleStyle: data.messageBubbleStyle,
    roomId: data.roomId,
    connectedAt: data.connectedAt,
  };
}

