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
    locale: varchar("locale", { length: 16 }).default("ar"),
    profile: jsonb("profile").default({}).notNull(),
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
