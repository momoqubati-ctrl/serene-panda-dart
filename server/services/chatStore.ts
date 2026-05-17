import { db } from "../db/index";
import { rooms } from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

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
// We keep max 100 messages per room in memory
const inMemoryMessages = new Map<string, ChatMessage[]>();
const subscribersByRoom = new Map<string, Set<(message: ChatMessage) => void>>();

export const listRooms = async () => {
  const dbRooms = await db.select().from(rooms).where(eq(rooms.isDeleted, false));
  
  if (dbRooms.length === 0) {
    // Return default if none in DB yet
    return [
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
  }

  return dbRooms.map(r => ({
    id: r.slug,
    name: r.name,
    description: r.description || "",
    owner: "إدارة الموقع",
    image: r.avatarUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop",
    members: 0,
    mics: r.micSlots,
    likes: 0,
    locked: !r.isPublic,
  }));
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
  
  // Keep only the last 100 messages in memory
  if (roomMsgs.length > 100) {
    roomMsgs.shift();
  }
  
  inMemoryMessages.set(input.roomId, roomMsgs);

  subscribersByRoom.get(input.roomId)?.forEach((callback) => callback(message));
  
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
