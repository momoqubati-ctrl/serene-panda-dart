import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const accountRole = pgEnum("account_role", ["guest", "member", "moderator", "owner", "admin", "agent"]);
export const accountStatus = pgEnum("account_status", ["active", "muted", "banned", "suspended", "deleted"]);
export const edgeType = pgEnum("edge_type", ["friend", "follow", "block", "mute", "mutual"]);
export const presenceStatus = pgEnum("presence_status", ["online", "idle", "lurking", "active", "multitasking"]);

// --- 1. SOCIAL GRAPH ENGINE ---
export const socialEdges = pgTable(
  "social_edges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    targetId: uuid("target_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    type: edgeType("type").notNull(),
    weight: integer("weight").default(1).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("social_edges_pair_idx").on(table.sourceId, table.targetId, table.type),
    index("social_edges_source_idx").on(table.sourceId),
    index("social_edges_target_idx").on(table.targetId),
  ]
);

export const socialAffinity = pgTable(
  "social_affinity",
  {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    relatedId: uuid("related_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    score: numeric("score", { precision: 10, scale: 2 }).default("0").notNull(),
    interactionCount: integer("interaction_count").default(0).notNull(),
    lastInteractionAt: timestamp("last_interaction_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.relatedId] }),
    index("social_affinity_score_idx").on(table.score),
  ]
);

// --- 2. DYNAMIC IDENTITY ENGINE ---
export const identityEffects = pgTable(
  "identity_effects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    type: varchar("type", { length: 40 }).notNull(),
    config: jsonb("config").default({}).notNull(),
    assetUrl: text("asset_url"),
    isPremium: boolean("is_premium").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [uniqueIndex("identity_effects_slug_idx").on(table.slug)]
);

export const userIdentityState = pgTable(
  "user_identity_state",
  {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    activeFrameId: uuid("active_frame_id").references(() => identityEffects.id),
    activeAuraId: uuid("active_aura_id").references(() => identityEffects.id),
    activeThemeId: varchar("active_theme_id", { length: 80 }),
    customCss: text("custom_css"),
    reactiveConfig: jsonb("reactive_config").default({}).notNull(),
  }
);

// --- 3. REPUTATION & TRUST ENGINE ---
export const behaviorScores = pgTable(
  "behavior_scores",
  {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    trustScore: integer("trust_score").default(50).notNull(),
    toxicityScore: integer("toxicity_score").default(0).notNull(),
    influenceScore: integer("influence_score").default(0).notNull(),
    spamProbability: numeric("spam_probability", { precision: 4, scale: 3 }).default("0").notNull(),
    lastRecalculatedAt: timestamp("last_recalculated_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

// --- 4. ACTIVITY STREAM ---
export const activityStream = pgTable(
  "activity_stream",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    verb: varchar("verb", { length: 64 }).notNull(),
    objectType: varchar("object_type", { length: 64 }).notNull(),
    objectId: varchar("object_id", { length: 128 }),
    targetId: varchar("target_id", { length: 128 }),
    metadata: jsonb("metadata").default({}).notNull(),
    visibility: varchar("visibility", { length: 32 }).default("public").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("activity_stream_actor_idx").on(table.actorId),
    index("activity_stream_verb_idx").on(table.verb),
    index("activity_stream_created_idx").on(table.createdAt),
  ]
);

// --- 5. CORE TABLES (RESTORED) ---
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyId: integer("legacy_id"),
    username: varchar("username", { length: 64 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    passwordHash: text("password_hash"),
    role: accountRole("role").default("member").notNull(),
    status: accountStatus("status").default("active").notNull(),
    avatarUrl: text("avatar_url"),
    coverUrl: text("cover_url"),
    countryCode: varchar("country_code", { length: 16 }),
    presence: presenceStatus("presence").default("online").notNull(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_username_idx").on(table.username),
  ]
);

export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  idreg: varchar("idreg", { length: 40 }),
  lid: varchar("lid", { length: 40 }),
  uid: varchar("uid", { length: 40 }),
  profileMsg: text("profile_msg"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  themeId: varchar("theme_id", { length: 80 }),
  avatarFrameUrl: text("avatar_frame_url"),
  giftIconUrl: text("gift_icon_url"),
  profileIconUrl: text("profile_icon_url"),
  nameGradient: text("name_gradient"),
  nameEffectId: varchar("name_effect_id", { length: 80 }),
  messageBubbleStyle: varchar("message_bubble_style", { length: 80 }),
  profileAccentColor: varchar("profile_accent_color", { length: 20 }),
  profileBackgroundUrl: text("profile_background_url"),
  backgroundColor: varchar("background_color", { length: 20 }),
  messageColor: varchar("message_color", { length: 20 }),
  nameColor: varchar("name_color", { length: 20 }),
  gradientColor: varchar("gradient_color", { length: 20 }),
  evaluation: integer("evaluation").default(0),
  rep: integer("rep").default(0),
  coins: integer("coins").default(0),
  wallPostLikes: integer("wall_post_likes").default(0),
  giftsReceivedCount: integer("gifts_received_count").default(0),
  power: varchar("power", { length: 80 }),
  icon: text("icon"),
  isLogin: varchar("is_login", { length: 20 }),
  muted: boolean("muted").default(false),
  documents: boolean("documents").default(false),
  busy: boolean("busy").default(false),
  alerts: boolean("alerts").default(true),
  nopmcall: boolean("nopmcall").default(false),
  nopmvideocall: boolean("nopmvideocall").default(false),
  roomId: varchar("room_id", { length: 128 }),
  siteBadgeId: varchar("site_badge_id", { length: 80 }),
  siteBadge: text("site_badge"),
  joinuser: bigint("joinuser", { mode: "number" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 128 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    ownerId: uuid("owner_id").references(() => users.id),
    avatarUrl: text("avatar_url"),
    isPublic: boolean("is_public").default(true).notNull(),
    settings: jsonb("settings").default({}).notNull(),
    engagementScore: integer("engagement_score").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("rooms_slug_idx").on(table.slug)]
);

export const moderationEvents = pgTable("moderation_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "cascade" }),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  reason: text("reason"),
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 120 }).primaryKey(),
  value: jsonb("value").default({}).notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatBots = pgTable("chat_bots", {
  id: uuid("id").defaultRandom().primaryKey(),
  botKey: varchar("bot_key", { length: 80 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  kind: varchar("kind", { length: 60 }).notNull(),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").default(true).notNull(),
  settings: jsonb("settings").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("chat_bots_key_idx").on(table.botKey)]);

export const moderationFilters = pgTable("moderation_filters", {
  id: uuid("id").defaultRandom().primaryKey(),
  pattern: varchar("pattern", { length: 240 }).notNull(),
  action: varchar("action", { length: 40 }).default("block").notNull(),
  scope: varchar("scope", { length: 40 }).default("global").notNull(),
  severity: integer("severity").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 120 }).notNull(),
  targetType: varchar("target_type", { length: 64 }),
  targetId: varchar("target_id", { length: 128 }),
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const wallPosts = pgTable("wall_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "cascade" }),
  body: text("body"),
  mediaUrl: text("media_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const wallComments = pgTable("wall_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").references(() => wallPosts.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "cascade" }),
  body: text("body"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const wallPostLikes = pgTable("wall_post_likes", {
  postId: uuid("post_id").references(() => wallPosts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.postId, table.userId] })]);