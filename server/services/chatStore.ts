import { dbPool } from "../db/index";
import { randomUUID } from "node:crypto";
import { eventBus } from "../core/events/EventBus";
import { bootstrapWorkers } from "../workers";

export type ChatRoom = {
  id: string;
  name: string;
  description: string;
  owner: string;
  image: string;
  members: number;
  mics: number;
  likes: number;
  locked: boolean;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  clientId?: string;
  user: string;
  role: "guest" | "member" | "admin" | "bot" | "system";
  text: string;
  avatar: string;
  countryCode: string;
  avatarFrameUrl?: string;
  giftIconUrl?: string;
  messageBubbleStyle?: string;
  color: string;
  isOwner?: boolean;
  isSystem?: boolean;
  createdAt: string;
};

// In-memory message store: map of roomId -> array of messages
const inMemoryMessages = new Map<string, ChatMessage[]>();
const subscribersByRoom = new Map<string, Set<(message: ChatMessage) => void>>();

const DEFAULT_ROOMS = [
  {
    id: "general",
    name: "الغرفة العامة",
    description: "أهلاً بكم في الغرفة العامة للجميع",
    owner: "إدارة الموقع",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop",
    members: 0, mics: 5, likes: 1000, locked: false,
  },
  {
    id: "events",
    name: "غرفة المسابقات",
    description: "مسابقات وألعاب تفاعلية مباشرة",
    owner: "المشرف الذهبي",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
    members: 0, mics: 3, likes: 500, locked: false,
  }
];

export const listRooms = async () => {
  try {
    // محاولة جلب الغرف باستخدام الاستعلام المتوافق مع القاعدة القديمة
    const result = await dbPool.query(`
      SELECT 
        idroom as "id",
        id as "slug",
        topic as "name",
        about as "description",
        owner,
        pic as "image",
        mic as "mics",
        COALESCE(needpass, 0) != 0 as "locked"
      FROM rooms 
      WHERE COALESCE(deleted, 0) = 0
      ORDER BY idroom ASC
      LIMIT 100
    `);

    if (result.rowCount === 0) {
      return DEFAULT_ROOMS;
    }

    return result.rows.map(r => ({
      id: String(r.slug || r.id),
      name: r.name || "غرفة بدون اسم",
      description: r.description || "",
      owner: r.owner || "إدارة الموقع",
      image: r.image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop",
      members: 0,
      mics: Number(r.mics) || 0,
      likes: 0,
      locked: Boolean(r.locked),
    }));
  } catch (err) {
    console.error("Failed to list rooms from DB, using defaults:", err);
    return DEFAULT_ROOMS;
  }
};

export const listMessages = (roomId: string, after?: string) => {
  const messages = inMemoryMessages.get(roomId) || [];
  
  if (!after) {
    return messages;
  }
  
  const afterTime = new Date(after).getTime();
  if (isNaN(afterTime)) {
    return messages;
  }
  
  return messages.filter(m => new Date(m.createdAt).getTime() > afterTime);
};

export const updateUserMessageIdentity = (
  username: string,
  updates: { avatar?: string; avatarFrameUrl?: string; giftIconUrl?: string; messageBubbleStyle?: string },
) => {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) return;

  for (const [roomId, messages] of inMemoryMessages.entries()) {
    const nextMessages = messages.map((message) => {
      if (message.user !== normalizedUsername) return message;

      return {
        ...message,
        avatar: updates.avatar?.trim() || message.avatar,
        avatarFrameUrl: updates.avatarFrameUrl?.trim() || message.avatarFrameUrl,
        giftIconUrl: updates.giftIconUrl?.trim() || message.giftIconUrl,
        messageBubbleStyle: updates.messageBubbleStyle?.trim() || message.messageBubbleStyle,
      };
    });

    inMemoryMessages.set(roomId, nextMessages);
  }
};

export const addMessage = (input: {
  roomId: string;
  clientId?: string;
  user?: string;
  role?: ChatMessage["role"];
  countryCode?: string;
  avatar?: string;
  avatarFrameUrl?: string;
  giftIconUrl?: string;
  messageBubbleStyle?: string;
  text: string;
  isSystem?: boolean;
}) => {
  const message: ChatMessage = {
    id: randomUUID(),
    roomId: input.roomId,
    clientId: input.clientId,
    user: input.user?.trim().slice(0, 80) || "زائر",
    role: input.role ?? "guest",
    avatar: input.avatar?.trim().slice(0, 255) || "/pic.png",
    countryCode: String(input.countryCode || "SA").trim().toUpperCase().slice(0, 2) || "SA",
    avatarFrameUrl: input.avatarFrameUrl?.trim().slice(0, 255) || "",
    giftIconUrl: input.giftIconUrl?.trim().slice(0, 255) || "",
    messageBubbleStyle: input.messageBubbleStyle?.trim().slice(0, 64) || "default",
    text: input.text.trim().slice(0, 1000),
    color: input.role === "admin" ? "text-red-600" : "text-slate-700",
    isOwner: input.role === "admin",
    isSystem: input.isSystem || false,
    createdAt: new Date().toISOString(),
  };

  const roomMsgs = inMemoryMessages.get(input.roomId) || [];
  roomMsgs.push(message);
  
  if (roomMsgs.length > 100) {
    roomMsgs.shift();
  }
  
  inMemoryMessages.set(input.roomId, roomMsgs);

  subscribersByRoom.get(input.roomId)?.forEach((callback) => callback(message));

  bootstrapWorkers();
  eventBus.publish({
    type: "message.sent",
    stream: "messages",
    actor: {
      username: message.user,
      role: message.role,
    },
    target: {
      id: message.id,
      type: "message",
      roomId: message.roomId,
    },
    payload: {
      id: message.id,
      clientId: message.clientId,
      roomId: message.roomId,
      text: message.text,
      role: message.role,
      createdAt: message.createdAt,
    },
    metadata: {
      roomId: message.roomId,
      source: "chatStore.addMessage",
      shardKey: message.roomId,
    },
  }).catch(err => console.error("EventBus publish failed in addMessage:", err));
  
  return message;
};

export const subscribeToRoom = (roomId: string, callback: (message: ChatMessage) => void) => {
  const subscribers = subscribersByRoom.get(roomId) ?? new Set<(message: ChatMessage) => void>();
  subscribers.add(callback);
  subscribersByRoom.set(roomId, subscribers);

  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) {
      subscribersByRoom.delete(roomId);
    }
  };
};
