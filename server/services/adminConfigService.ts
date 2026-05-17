import { db } from "../db";
import { adminAuditLogs, chatBots, moderationFilters, siteSettings } from "../db/schema";
import { asc, desc, eq } from "drizzle-orm";

export const DEFAULT_CHAT_SETTINGS = {
  siteName: "دردشة دياد",
  welcomeMessage: "أهلاً بك في الدردشة",
  defaultLocale: "ar",
  allowGuests: true,
  maintenanceMode: false,
  maxMessageLength: 1000,
  maxAccountsPerIp: 3,
  blockVpn: false,
  roomCreationEnabled: true,
  publicWallEnabled: true,
  storiesEnabled: true,
  giftsEnabled: true,
  botsEnabled: true,
};

export const DEFAULT_BOTS = [
  {
    botKey: "welcome_guard",
    name: "مساعد الترحيب",
    description: "يرحب بالأعضاء الجدد ويعرض قواعد الغرفة بشكل لطيف.",
    kind: "welcome",
    avatarUrl: "/pic.png",
    isActive: true,
    settings: { greetingDelaySeconds: 2 },
  },
  {
    botKey: "room_quiz",
    name: "مسابقات الغرفة",
    description: "يدير أسئلة سريعة وتحديات تفاعلية داخل الغرف.",
    kind: "quiz",
    avatarUrl: "/pic.png",
    isActive: true,
    settings: { intervalMinutes: 15, rewardCoins: 5 },
  },
  {
    botKey: "safety_watch",
    name: "مراقب الحماية",
    description: "يراقب التكرار والكلمات الممنوعة ويرفع تنبيهات للإدارة.",
    kind: "moderation",
    avatarUrl: "/pic.png",
    isActive: true,
    settings: { spamWindowSeconds: 8, repeatedLimit: 4 },
  },
];

export const normalizeChatSettings = (input: any) => ({
  ...DEFAULT_CHAT_SETTINGS,
  ...(input && typeof input === "object" ? input : {}),
  siteName: String(input?.siteName || DEFAULT_CHAT_SETTINGS.siteName).trim().slice(0, 80),
  welcomeMessage: String(input?.welcomeMessage || DEFAULT_CHAT_SETTINGS.welcomeMessage).trim().slice(0, 240),
  defaultLocale: "ar",
  allowGuests: Boolean(input?.allowGuests),
  maintenanceMode: Boolean(input?.maintenanceMode),
  maxMessageLength: Math.min(4000, Math.max(120, Number(input?.maxMessageLength) || DEFAULT_CHAT_SETTINGS.maxMessageLength)),
  maxAccountsPerIp: Math.min(20, Math.max(1, Number(input?.maxAccountsPerIp) || DEFAULT_CHAT_SETTINGS.maxAccountsPerIp)),
  blockVpn: Boolean(input?.blockVpn),
  roomCreationEnabled: input?.roomCreationEnabled !== false,
  publicWallEnabled: input?.publicWallEnabled !== false,
  storiesEnabled: input?.storiesEnabled !== false,
  giftsEnabled: input?.giftsEnabled !== false,
  botsEnabled: input?.botsEnabled !== false,
});

export const getChatSettings = async () => {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, "chat")).limit(1);
  return normalizeChatSettings(row?.value);
};

export const saveChatSettings = async (settings: any, actorId?: string) => {
  const value = normalizeChatSettings(settings);
  await db
    .insert(siteSettings)
    .values({ key: "chat", value, updatedBy: actorId || null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedBy: actorId || null, updatedAt: new Date() },
    });
  await logAdminAction({ actorId, action: "settings.chat.update", targetType: "site_settings", targetId: "chat", metadata: value });
  return value;
};

export const ensureDefaultBots = async () => {
  for (const bot of DEFAULT_BOTS) {
    await db
      .insert(chatBots)
      .values(bot)
      .onConflictDoNothing({ target: chatBots.botKey });
  }
};

export const listChatBots = async () => {
  await ensureDefaultBots();
  return db.select().from(chatBots).orderBy(desc(chatBots.isActive), asc(chatBots.name));
};

export const createChatBot = async (input: any, actorId?: string) => {
  const botKey = String(input?.botKey || input?.name || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 80);
  const name = String(input?.name || "").trim().slice(0, 120);
  if (!botKey || !name) {
    return { ok: false as const, message: "اسم البوت ومعرفه مطلوبان" };
  }

  const [bot] = await db
    .insert(chatBots)
    .values({
      botKey,
      name,
      description: String(input?.description || "").trim().slice(0, 500),
      kind: String(input?.kind || "assistant").trim().slice(0, 60),
      avatarUrl: String(input?.avatarUrl || "/pic.png").trim().slice(0, 500),
      isActive: input?.isActive !== false,
      settings: input?.settings && typeof input.settings === "object" ? input.settings : {},
    })
    .returning();

  await logAdminAction({ actorId, action: "bot.create", targetType: "chat_bots", targetId: bot.id, metadata: { botKey } });
  return { ok: true as const, bot };
};

export const listModerationFilters = async () => {
  return db.select().from(moderationFilters).orderBy(desc(moderationFilters.isActive), desc(moderationFilters.createdAt));
};

export const createModerationFilter = async (input: any, actorId?: string) => {
  const pattern = String(input?.pattern || "").trim().slice(0, 240);
  if (!pattern) {
    return { ok: false as const, message: "نص الفلتر مطلوب" };
  }

  const [filter] = await db
    .insert(moderationFilters)
    .values({
      pattern,
      action: String(input?.action || "block").trim().slice(0, 40),
      scope: String(input?.scope || "global").trim().slice(0, 40),
      severity: Math.min(5, Math.max(1, Number(input?.severity) || 1)),
      isActive: input?.isActive !== false,
      note: input?.note ? String(input.note).trim().slice(0, 240) : null,
    })
    .returning();

  await logAdminAction({ actorId, action: "filter.create", targetType: "moderation_filters", targetId: filter.id, metadata: { pattern } });
  return { ok: true as const, filter };
};

export const logAdminAction = async (input: {
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: any;
}) => {
  await db.insert(adminAuditLogs).values({
    actorId: input.actorId || null,
    action: input.action,
    targetType: input.targetType || null,
    targetId: input.targetId || null,
    metadata: input.metadata || {},
  });
};
