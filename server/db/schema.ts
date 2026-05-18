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
    weight: integer("weight").default(1).notNull(), // قوة العلاقة
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
    type: varchar("type", { length: 40 }).notNull(), // frame, aura, bubble, name_gradient
    config: jsonb("config").default({}).notNull(), // CSS/Animation properties
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
    reactiveConfig: jsonb("reactive_config").default({}).notNull(), // Voice/Presence reactivity
  }
);

// --- 3. REPUTATION & TRUST ENGINE ---
export const behaviorScores = pgTable(
  "behavior_scores",
  {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    trustScore: integer("trust_score").default(50).notNull(), // 0-100
    toxicityScore: integer("toxicity_score").default(0).notNull(), // 0-100
    influenceScore: integer("influence_score").default(0).notNull(),
    spamProbability: numeric("spam_probability", { precision: 4, scale: 3 }).default("0").notNull(),
    lastRecalculatedAt: timestamp("last_recalculated_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

// --- 4. ACTIVITY STREAM (EVENT SOURCING READY) ---
export const activityStream = pgTable(
  "activity_stream",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    verb: varchar("verb", { length: 64 }).notNull(), // joined, sent, followed, reacted
    objectType: varchar("object_type", { length: 64 }).notNull(), // room, message, user
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

// --- EXISTING TABLES (RETAINED & UPDATED) ---
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

export const wallPosts = pgTable("wall_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "cascade" }),
  body: text("body"),
  mediaUrl: text("media_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});