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

const rooms: ChatRoom[] = [
  {
    id: "general",
    name: "الغرفة العامة",
    description: "أهلاً بكم في الغرفة العامة للجميع",
    owner: "إدارة الموقع",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop",
    members: 0,
    mics: 5,
    likes: 1000,
    locked: false,
  },
  {
    id: "events",
    name: "غرفة المسابقات",
    description: "مسابقات وألعاب تفاعلية مباشرة",
    owner: "المشرف الذهبي",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
    members: 0,
    mics: 3,
    likes: 500,
    locked: false,
  },
];

const messagesByRoom = new Map<string, ChatMessage[]>();
const subscribersByRoom = new Map<string, Set<(message: ChatMessage) => void>>();

const now = () => new Date().toISOString();
const normalizeMessageCountryCode = (value?: string) => String(value || "SA").trim().toUpperCase().slice(0, 2) || "SA";

const seedRoom = (roomId: string) => {
  if (messagesByRoom.has(roomId)) return;

  const room = rooms.find((item) => item.id === roomId);
  messagesByRoom.set(roomId, [
    {
      id: crypto.randomUUID(),
      roomId,
      user: "بوت الترحيب",
      role: "bot",
      text: `مرحباً بكم في ${room?.name ?? "الغرفة"}. الإرسال هنا حقيقي عبر السيرفر، وسيتم نقله لاحقاً إلى WebSocket وPostgreSQL.`,
      avatar: "https://i.pravatar.cc/150?u=welcome-bot",
      countryCode: "SA",
      color: "text-teal-600",
      isSystem: true,
      createdAt: now(),
    },
  ]);
};

export const listRooms = () => rooms;

export const listMessages = (roomId: string, after?: string) => {
  seedRoom(roomId);
  const messages = messagesByRoom.get(roomId) ?? [];

  if (!after) return messages.slice(-100);

  const afterTime = Date.parse(after);
  if (Number.isNaN(afterTime)) return messages.slice(-100);

  return messages.filter((message) => Date.parse(message.createdAt) > afterTime).slice(-100);
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
}) => {
  seedRoom(input.roomId);

  const normalizedText = input.text.trim().slice(0, 1000);
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    roomId: input.roomId,
    clientId: input.clientId,
    user: input.user?.trim().slice(0, 80) || "زائر",
    role: input.role ?? "guest",
    text: normalizedText,
    avatar: input.avatar?.trim().slice(0, 255) || "/pic.png",
    countryCode: normalizeMessageCountryCode(input.countryCode),
    avatarFrameUrl: input.avatarFrameUrl?.trim().slice(0, 255) || "",
    giftIconUrl: input.giftIconUrl?.trim().slice(0, 255) || "",
    messageBubbleStyle: input.messageBubbleStyle?.trim().slice(0, 64) || "default",
    color: input.role === "admin" ? "text-red-600" : "text-slate-700",
    isOwner: input.role === "admin",
    createdAt: now(),
  };

  const messages = messagesByRoom.get(input.roomId) ?? [];
  messages.push(message);

  if (messages.length > 500) {
    messages.splice(0, messages.length - 500);
  }

  messagesByRoom.set(input.roomId, messages);
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
