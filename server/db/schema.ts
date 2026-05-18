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
export const messageKind = pgEnum("message_kind", ["text", "image", "file", "gift", "system"]);
export const messageStatus = pgEnum("message_status", ["pending", "sent", "edited", "deleted", "blocked"]);
export const walletOwnerType = pgEnum("wallet_owner_type", ["site", "user", "agent"]);
export const ledgerDirection = pgEnum("ledger_direction", ["credit", "debit"]);

// --- نظام الرتب الجديد ---
export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    iconUrl: text("icon_url").default("").notNull(),
    color: varchar("color", { length: 32 }).default("#000000").notNull(),
    rankPriority: integer("rank_priority").default(0).notNull(), // الهرمية: الرقم الأعلى يتفوق
    isStaff: boolean("is_staff").default(false).notNull(),
    isHidden: boolean("is_hidden").default(false).notNull(),
    autoEnabled: boolean("auto_enabled").default(false).notNull(),
    autoPoints: integer("auto_points").default(0).notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("roles_slug_idx").on(table.slug),
    index("roles_priority_idx").on(table.rankPriority),
  ],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
    permissionKey: varchar("permission_key", { length: 120 }).notNull(),
    permissionValue: jsonb("permission_value").default(true).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionKey] }),
  ],
);

// --- نقاط المستخدمين والترقية ---
export const userPoints = pgTable(
  "user_points",
  {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    totalPoints: bigint("total_points", { mode: "number" }).default(0).notNull(),
    messageCount: integer("message_count").default(0).notNull(),
    activityMinutes: integer("activity_count").default(0).notNull(),
    likesReceived: integer("likes_received").default(0).notNull(),
    lastUpdate: timestamp("last_update", { withTimezone: true }).defaultNow().notNull(),
  }
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyId: integer("legacy_id"),
    username: varchar("username", { length: 64 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    passwordHash: text("password_hash"),
    role: accountRole("role").default("member").notNull(), // Fallback role
    dynamicRoleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }), // الرتبة الديناميكية
    status: accountStatus("status").default("active").notNull(),
    avatarUrl: text("avatar_url"),
    coverUrl: text("cover_url"),
    countryCode: varchar("country_code", { length: 16 }),
    locale: varchar("locale", { length: 16 }).default("ar"),
    profile: jsonb("profile").default({}).notNull(),
    requiresPasswordReset: boolean("requires_password_reset").default(false).notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_username_idx").on(table.username),
    index("users_legacy_id_idx").on(table.legacyId),
    index("users_status_idx").on(table.status),
  ],
);

export const userProfiles = pgTable(
  "user_profiles",
  {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    idreg: varchar("idreg", { length: 32 }).notNull(),
    lid: varchar("lid", { length: 64 }).notNull(),
    uid: varchar("uid", { length: 64 }).notNull(),
    profileMsg: text("profile_msg").notNull(),
    avatarUrl: text("avatar_url").default("/pic.png").notNull(),
    bannerUrl: text("banner_url").default("/pich.png").notNull(),
    themeId: varchar("theme_id", { length: 80 }).default("").notNull(),
    avatarFrameUrl: text("avatar_frame_url").default("").notNull(),
    giftIconUrl: text("gift_icon_url").default("").notNull(),
    profileIconUrl: text("profile_icon_url").default("").notNull(),
    nameGradient: text("name_gradient").default("").notNull(),
    nameEffectId: varchar("name_effect_id", { length: 80 }).default("").notNull(),
    messageBubbleStyle: varchar("message_bubble_style", { length: 64 }).default("default").notNull(),
    profileAccentColor: varchar("profile_accent_color", { length: 32 }).default("#2563EB").notNull(),
    profileBackgroundUrl: text("profile_background_url").default("").notNull(),
    backgroundColor: varchar("background_color", { length: 32 }).default("#FFFFFF").notNull(),
    messageColor: varchar("message_color", { length: 32 }).default("#000000").notNull(),
    nameColor: varchar("name_color", { length: 32 }).default("#000000").notNull(),
    gradientColor: varchar("gradient_color", { length: 32 }).default("#FFFFFF").notNull(),
    evaluation: integer("evaluation").default(0).notNull(),
    rep: bigint("rep", { mode: "number" }).default(0).notNull(),
    coins: bigint("coins", { mode: "number" }).default(0).notNull(),
    wallPostLikes: bigint("wall_post_likes", { mode: "number" }).default(0).notNull(),
    giftsReceivedCount: bigint("gifts_received_count", { mode: "number" }).default(0).notNull(),
    power: varchar("power", { length: 120 }).default("").notNull(),
    icon: text("icon").default("").notNull(),
    isLogin: varchar("is_login", { length: 32 }).default("عضو").notNull(),
    muted: boolean("muted").default(false).notNull(),
    documents: boolean("documents").default(false).notNull(),
    busy: boolean("busy").default(false).notNull(),
    alerts: boolean("alerts").default(false).notNull(),
    nopmcall: boolean("nopmcall").default(false).notNull(),
    nopmvideocall: boolean("nopmvideocall").default(false).notNull(),
    roomId: varchar("room_id", { length: 128 }).default("general").notNull(),
    siteBadgeId: varchar("site_badge_id", { length: 128 }).default("").notNull(),
    siteBadge: text("site_badge").default("").notNull(),
    joinuser: bigint("joinuser", { mode: "number" }).notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_profiles_uid_idx").on(table.uid),
    uniqueIndex("user_profiles_idreg_idx").on(table.idreg),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    deviceFingerprint: text("device_fingerprint"),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    uniqueIndex("sessions_refresh_token_hash_idx").on(table.refreshTokenHash),
  ],
);

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyId: varchar("legacy_id", { length: 128 }),
    slug: varchar("slug", { length: 128 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    avatarUrl: text("avatar_url"),
    isPublic: boolean("is_public").default(true).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    maxMembers: integer("max_members").default(500).notNull(),
    micSlots: integer("mic_slots").default(0).notNull(),
    settings: jsonb("settings").default({}).notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("rooms_slug_idx").on(table.slug),
    index("rooms_legacy_id_idx").on(table.legacyId),
    index("rooms_owner_id_idx").on(table.ownerId),
  ],
);

export const roomMembers = pgTable(
  "room_members",
  {
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    role: accountRole("role").default("member").notNull(),
    isMuted: boolean("is_muted").default(false).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roomId, table.userId] }),
    index("room_members_user_id_idx").on(table.userId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: varchar("client_id", { length: 128 }),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
    senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
    replyToId: uuid("reply_to_id"),
    kind: messageKind("kind").default("text").notNull(),
    status: messageStatus("status").default("sent").notNull(),
    body: text("body"),
    metadata: jsonb("metadata").default({}).notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("messages_room_created_idx").on(table.roomId, table.createdAt),
    index("messages_sender_id_idx").on(table.senderId),
    uniqueIndex("messages_client_id_idx").on(table.clientId),
  ],
);

export const wallPosts = pgTable(
  "wall_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyBid: varchar("legacy_bid", { length: 128 }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body"),
    mediaUrl: text("media_url"),
    metadata: jsonb("metadata").default({}).notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("wall_posts_author_id_idx").on(table.authorId),
    index("wall_posts_created_at_idx").on(table.createdAt),
  ],
);

export const wallComments = pgTable(
  "wall_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id").references(() => wallPosts.id, { onDelete: "cascade" }).notNull(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    parentId: uuid("parent_id"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("wall_comments_post_id_idx").on(table.postId),
    index("wall_comments_parent_id_idx").on(table.parentId),
  ],
);

export const follows = pgTable(
  "follows",
  {
    followerId: uuid("follower_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    followingId: uuid("following_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followingId] }),
    index("follows_following_id_idx").on(table.followingId),
  ],
);

export const stories = pgTable(
  "stories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    mediaUrl: text("media_url").notNull(),
    mediaType: varchar("media_type", { length: 32 }).default("image").notNull(),
    caption: text("caption"),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("stories_author_id_idx").on(table.authorId),
    index("stories_expires_at_idx").on(table.expiresAt),
  ],
);

export const gifts = pgTable(
  "gifts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    imageUrl: text("image_url").notNull(),
    category: varchar("category", { length: 80 }).default("default").notNull(),
    priceCoins: bigint("price_coins", { mode: "number" }).default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("gifts_is_active_idx").on(table.isActive),
  ],
);

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerType: walletOwnerType("owner_type").notNull(),
    ownerId: uuid("owner_id"),
    balanceCoins: bigint("balance_coins", { mode: "number" }).default(0).notNull(),
    reservedCoins: bigint("reserved_coins", { mode: "number" }).default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("wallets_owner_idx").on(table.ownerType, table.ownerId),
  ],
);

export const walletLedger = pgTable(
  "wallet_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    txid: varchar("txid", { length: 128 }).notNull(),
    walletId: uuid("wallet_id").references(() => wallets.id, { onDelete: "cascade" }).notNull(),
    direction: ledgerDirection("direction").notNull(),
    eventType: varchar("event_type", { length: 80 }).notNull(),
    amountCoins: bigint("amount_coins", { mode: "number" }).notNull(),
    beforeBalance: bigint("before_balance", { mode: "number" }).notNull(),
    afterBalance: bigint("after_balance", { mode: "number" }).notNull(),
    counterpartyWalletId: uuid("counterparty_wallet_id"),
    referenceType: varchar("reference_type", { length: 80 }),
    referenceId: uuid("reference_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("wallet_ledger_txid_idx").on(table.txid),
    index("wallet_ledger_wallet_id_idx").on(table.walletId),
    index("wallet_ledger_created_at_idx").on(table.createdAt),
  ],
);

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    code: varchar("code", { length: 64 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    countryCode: varchar("country_code", { length: 16 }),
    city: varchar("city", { length: 160 }),
    phone: varchar("phone", { length: 64 }),
    commissionType: varchar("commission_type", { length: 32 }).default("wallet_transfer").notNull(),
    commissionValue: numeric("commission_value", { precision: 18, scale: 4 }).default("0").notNull(),
    canReceiveOrders: boolean("can_receive_orders").default(true).notNull(),
    status: accountStatus("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("agents_code_idx").on(table.code),
    index("agents_user_id_idx").on(table.userId),
  ],
);

export const moderationEvents = pgTable(
  "moderation_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
    eventType: varchar("event_type", { length: 80 }).notNull(),
    reason: text("reason"),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    index("moderation_events_target_user_id_idx").on(table.targetUserId),
    index("moderation_events_room_id_idx").on(table.roomId),
  ],
);

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 120 }).primaryKey(),
  value: jsonb("value").default({}).notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatBots = pgTable(
  "chat_bots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    botKey: varchar("bot_key", { length: 120 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description").default("").notNull(),
    kind: varchar("kind", { length: 80 }).default("assistant").notNull(),
    avatarUrl: text("avatar_url").default("/pic.png").notNull(),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
    isActive: boolean("is_active").default(true).notNull(),
    settings: jsonb("settings").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("chat_bots_key_idx").on(table.botKey),
    index("chat_bots_room_id_idx").on(table.roomId),
    index("chat_bots_active_idx").on(table.isActive),
  ],
);

export const moderationFilters = pgTable(
  "moderation_filters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pattern: text("pattern").notNull(),
    action: varchar("action", { length: 40 }).default("block").notNull(),
    scope: varchar("scope", { length: 40 }).default("global").notNull(),
    severity: integer("severity").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("moderation_filters_active_idx").on(table.isActive),
    index("moderation_filters_scope_idx").on(table.scope),
  ],
);

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 120 }).notNull(),
    targetType: varchar("target_type", { length: 80 }),
    targetId: varchar("target_id", { length: 160 }),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("admin_audit_logs_actor_idx").on(table.actorId),
    index("admin_audit_logs_created_idx").on(table.createdAt),
  ],
);

export const legacyImportBatches = pgTable("legacy_import_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceName: varchar("source_name", { length: 160 }).notNull(),
  sourceDatabase: varchar("source_database", { length: 160 }).default("safarihost").notNull(),
  dumpCompletedAt: timestamp("dump_completed_at", { withTimezone: true }),
  status: varchar("status", { length: 40 }).default("draft").notNull(),
  summary: jsonb("summary").default({}).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const legacyImportMappings = pgTable(
  "legacy_import_mappings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id").references(() => legacyImportBatches.id, { onDelete: "cascade" }),
    legacyTable: varchar("legacy_table", { length: 120 }).notNull(),
    legacyColumn: varchar("legacy_column", { length: 120 }).notNull(),
    targetTable: varchar("target_table", { length: 120 }).notNull(),
    targetColumn: varchar("target_column", { length: 120 }),
    mappingStrategy: text("mapping_strategy").notNull(),
    note: text("note").default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("legacy_import_mappings_lookup_idx").on(table.legacyTable, table.legacyColumn),
  ],
);

export const rolePermissionsLegacy = pgTable(
  "role_permissions_legacy",
  {
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
    permissionKey: varchar("permission_key", { length: 120 }).notNull(),
    permissionValue: jsonb("permission_value").default(true).notNull(),
    source: varchar("source", { length: 40 }).default("legacy_powers").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionKey] }),
  ],
);

export const userRoleAssignments = pgTable(
  "user_role_assignments",
  {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
    assignedBy: uuid("assigned_by").references(() => users.id, { onDelete: "set null" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
  ],
);

export const siteAssets = pgTable(
  "site_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assetType: varchar("asset_type", { length: 40 }).notNull(),
    name: varchar("name", { length: 160 }).default("").notNull(),
    fileUrl: text("file_url").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("site_assets_type_active_idx").on(table.assetType, table.isActive),
  ],
);

export const siteBadges = pgTable(
  "site_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyBadgeId: varchar("legacy_badge_id", { length: 128 }),
    name: varchar("name", { length: 160 }).notNull(),
    background: text("background").default("").notNull(),
    iconUrl: text("icon_url").default("").notNull(),
    background_type: varchar("background_type", { length: 40 }).default("static").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("site_badges_legacy_idx").on(table.legacyBadgeId),
  ],
);

export const roomBadges = pgTable(
  "room_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyBadgeId: varchar("legacy_badge_id", { length: 128 }),
    name: varchar("name", { length: 160 }).notNull(),
    background: text("background").default("").notNull(),
    iconUrl: text("icon_url").default("").notNull(),
    background_type: varchar("background_type", { length: 40 }).default("static").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("room_badges_legacy_idx").on(table.legacyBadgeId),
  ],
);

export const roomBadgeAssignments = pgTable(
  "room_badge_assignments",
  {
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    badgeId: uuid("badge_id").references(() => roomBadges.id, { onDelete: "set null" }),
    assignedBy: uuid("assigned_by").references(() => users.id, { onDelete: "set null" }),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roomId, table.userId] }),
  ],
);

export const roomWelcomeVisits = pgTable(
  "room_welcome_visits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }),
    identityKey: varchar("identity_key", { length: 255 }).notNull(),
    isGuest: boolean("is_guest").default(false).notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    visits: integer("visits").default(1).notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
  },
  (table) => [
    uniqueIndex("room_welcome_visits_identity_idx").on(table.roomId, table.identityKey),
  ],
);

export const wallPostLikes = pgTable(
  "wall_post_likes",
  {
    postId: uuid("post_id").references(() => wallPosts.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    reaction: varchar("reaction", { length: 40 }).default("like").notNull(),
    legacyIdentity: varchar("legacy_identity", { length: 255 }).default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.userId, table.reaction] }),
  ],
);

export const wallActivityEvents = pgTable(
  "wall_activity_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    activityType: varchar("activity_type", { length: 40 }).notNull(),
    avatarUrl: text("avatar_url").default("").notNull(),
    displayName: varchar("display_name", { length: 160 }).default("").notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("wall_activity_events_user_type_idx").on(table.userId, table.activityType),
  ],
);

export const storyViews = pgTable(
  "story_views",
  {
    storyId: uuid("story_id").references(() => stories.id, { onDelete: "cascade" }).notNull(),
    viewerId: uuid("viewer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    itemIndex: integer("item_index").default(0).notNull(),
    viewerName: varchar("viewer_name", { length: 160 }).default("").notNull(),
    viewerAvatarUrl: text("viewer_avatar_url").default("").notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow().notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.storyId, table.viewerId, table.itemIndex] }),
  ],
);

export const profileVisits = pgTable(
  "profile_visits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
    visitorId: uuid("visitor_id").references(() => users.id, { onDelete: "set null" }),
    visitorName: varchar("visitor_name", { length: 160 }).default("").notNull(),
    visitorAvatarUrl: text("visitor_avatar_url").default("").notNull(),
    visitorType: varchar("visitor_type", { length: 40 }).default("عضو").notNull(),
    isSeen: boolean("is_seen").default(false).notNull(),
    visitedAt: timestamp("visited_at", { withTimezone: true }).defaultNow().notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
  },
  (table) => [
    index("profile_visits_owner_seen_idx").on(table.ownerId, table.isSeen),
  ],
);

export const internalMail = pgTable(
  "internal_mail",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fromUserId: uuid("from_user_id").references(() => users.id, { onDelete: "set null" }),
    toUserId: uuid("to_user_id").references(() => users.id, { onDelete: "cascade" }),
    fromSnapshot: jsonb("from_snapshot").default({}).notNull(),
    toSnapshot: jsonb("to_snapshot").default({}).notNull(),
    body: text("body").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
  },
  (table) => [
    index("internal_mail_to_read_idx").on(table.toUserId, table.isRead),
  ],
);

export const shortcuts = pgTable(
  "shortcuts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    triggerText: varchar("trigger_text", { length: 255 }).notNull(),
    replacementText: text("replacement_text").notNull(),
    scope: varchar("scope", { length: 40 }).default("global").notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    isActive: boolean("is_active").default(true).notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("shortcuts_trigger_scope_idx").on(table.triggerText, table.scope),
  ],
);

export const introMessages = pgTable("intro_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: varchar("category", { length: 120 }).default("").notNull(),
  title: varchar("title", { length: 255 }).default("").notNull(),
  body: text("body").default("").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deviceFingerprints = pgTable(
  "device_fingerprints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    legacyUserId: varchar("legacy_user_id", { length: 64 }).default("").notNull(),
    fingerprint: text("fingerprint").notNull(),
    ipAddress: varchar("ip_address", { length: 64 }).default("").notNull(),
    displayName: varchar("display_name", { length: 160 }).default("").notNull(),
    username: varchar("username", { length: 160 }).default("").notNull(),
    countryCode: varchar("country_code", { length: 16 }).default("").notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("device_fingerprints_lookup_idx").on(table.ipAddress, table.legacyUserId),
  ],
);

export const moderationBans = pgTable(
  "moderation_bans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    targetName: varchar("target_name", { length: 255 }).default("").notNull(),
    banType: varchar("ban_type", { length: 80 }).default("").notNull(),
    decoderCode: varchar("decoder_code", { length: 255 }).default("").notNull(),
    deviceFingerprint: text("device_fingerprint").default("").notNull(),
    ipAddress: varchar("ip_address", { length: 64 }).default("").notNull(),
    countryCode: varchar("country_code", { length: 16 }).default("").notNull(),
    expiresLabel: varchar("expires_label", { length: 255 }).default("دائم").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    isActive: boolean("is_active").default(true).notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("moderation_bans_active_lookup_idx").on(table.isActive, table.ipAddress, table.countryCode),
  ],
);

export const coinPackages = pgTable(
  "coin_packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyId: bigint("legacy_id", { mode: "number" }),
    title: varchar("title", { length: 255 }).notNull(),
    coinsAmount: bigint("coins_amount", { mode: "number" }).notNull(),
    priceLocal: numeric("price_local", { precision: 18, scale: 4 }).default("0").notNull(),
    currency: varchar("currency", { length: 16 }).default("").notNull(),
    countryCode: varchar("country_code", { length: 16 }).default("").notNull(),
    city: varchar("city", { length: 160 }).default("").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    notes: text("notes"),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("coin_packages_active_sort_idx").on(table.isActive, table.countryCode, table.sortOrder),
  ],
);

export const agentPaymentMethods = pgTable(
  "agent_payment_methods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
    methodName: varchar("method_name", { length: 255 }).notNull(),
    accountName: varchar("account_name", { length: 255 }).default("").notNull(),
    accountIdentifier: varchar("account_identifier", { length: 255 }).default("").notNull(),
    instructions: text("instructions"),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("agent_payment_methods_agent_active_idx").on(table.agentId, table.isActive),
  ],
);

export const topupOrders = pgTable(
  "topup_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNo: varchar("order_no", { length: 64 }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
    packageId: uuid("package_id").references(() => coinPackages.id, { onDelete: "set null" }),
    userSnapshot: jsonb("user_snapshot").default({}).notNull(),
    agentSnapshot: jsonb("agent_snapshot").default({}).notNull(),
    packageSnapshot: jsonb("package_snapshot").default({}).notNull(),
    packageCoins: bigint("package_coins", { mode: "number" }).default(0).notNull(),
    packagePriceLocal: numeric("package_price_local", { precision: 18, scale: 4 }).default("0").notNull(),
    customerPriceLocal: numeric("customer_price_local", { precision: 18, scale: 4 }).default("0").notNull(),
    agentProfitLocal: numeric("agent_profit_local", { precision: 18, scale: 4 }).default("0").notNull(),
    agentCommissionType: varchar("agent_commission_type", { length: 32 }).default("wallet_transfer").notNull(),
    agentCommissionValue: numeric("agent_commission_value", { precision: 18, scale: 4 }).default("0").notNull(),
    agentCommissionCoins: bigint("agent_commission_coins", { mode: "number" }).default(0).notNull(),
    currency: varchar("currency", { length: 16 }).default("").notNull(),
    paymentMethodId: uuid("payment_method_id").references(() => agentPaymentMethods.id, { onDelete: "set null" }),
    paymentSnapshot: jsonb("payment_snapshot").default({}).notNull(),
    receiptPath: text("receipt_path").default("").notNull(),
    receiptUploadedAt: timestamp("receipt_uploaded_at", { withTimezone: true }),
    paymentReference: varchar("payment_reference", { length: 255 }).default("").notNull(),
    paymentNote: text("payment_note"),
    status: varchar("status", { length: 32 }).default("pending").notNull(),
    processedBy: uuid("processed_by").references(() => users.id, { onDelete: "set null" }),
    processedNote: text("processed_note"),
    rejectReason: text("reject_reason"),
    sourceIp: varchar("source_ip", { length: 64 }).default("").notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("topup_orders_order_no_idx").on(table.orderNo),
    index("topup_orders_status_requested_idx").on(table.status, table.requestedAt),
  ],
);

export const topupOrderEvents = pgTable(
  "topup_order_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").references(() => topupOrders.id, { onDelete: "cascade" }).notNull(),
    orderNo: varchar("order_no", { length: 64 }).default("").notNull(),
    eventType: varchar("event_type", { length: 64 }).notNull(),
    oldStatus: varchar("old_status", { length: 32 }).default("").notNull(),
    newStatus: varchar("new_status", { length: 32 }).default("").notNull(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    actorType: varchar("actor_type", { length: 64 }).default("").notNull(),
    note: text("note"),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("topup_order_events_order_idx").on(table.orderId, table.createdAt),
  ],
);

export const topupSettlementLedger = pgTable(
  "topup_settlement_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    txid: varchar("txid", { length: 128 }).notNull(),
    orderId: uuid("order_id").references(() => topupOrders.id, { onDelete: "set null" }),
    eventType: varchar("event_type", { length: 64 }).notNull(),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    packageId: uuid("package_id").references(() => coinPackages.id, { onDelete: "set null" }),
    packageCoins: bigint("package_coins", { mode: "number" }).default(0).notNull(),
    currency: varchar("currency", { length: 16 }).default("").notNull(),
    customerPriceLocal: numeric("customer_price_local", { precision: 18, scale: 4 }).default("0").notNull(),
    siteShareLocal: numeric("site_share_local", { precision: 18, scale: 4 }).default("0").notNull(),
    agentProfitLocal: numeric("agent_profit_local", { precision: 18, scale: 4 }).default("0").notNull(),
    processedBy: uuid("processed_by").references(() => users.id, { onDelete: "set null" }),
    note: text("note"),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("topup_settlement_txid_idx").on(table.txid),
    index("topup_settlement_agent_idx").on(table.agentId),
  ],
);

export const giftNotifications = pgTable(
  "gift_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    txid: varchar("txid", { length: 128 }).default("").notNull(),
    toUserId: uuid("to_user_id").references(() => users.id, { onDelete: "cascade" }),
    fromUserId: uuid("from_user_id").references(() => users.id, { onDelete: "set null" }),
    giftId: uuid("gift_id").references(() => gifts.id, { onDelete: "set null" }),
    giftFile: varchar("gift_file", { length: 255 }).default("").notNull(),
    coin: bigint("coin", { mode: "number" }).default(0).notNull(),
    note: text("note"),
    isRead: boolean("is_read").default(false).notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => [
    index("gift_notifications_to_read_idx").on(table.toUserId, table.isRead),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),
    topic: varchar("topic", { length: 255 }).default("").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
    legacyMetadata: jsonb("legacy_metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_user_active_idx").on(table.userId, table.isActive),
  ],
);