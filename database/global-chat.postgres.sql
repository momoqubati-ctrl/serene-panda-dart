-- Global chat database schema.
-- Target: PostgreSQL 16+
-- Encoding: UTF-8
-- Source inspiration: legacy Safari/MariaDB dump, redesigned for scalable realtime chat.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE account_role AS ENUM ('guest', 'member', 'moderator', 'owner', 'admin', 'agent');
CREATE TYPE account_status AS ENUM ('active', 'muted', 'banned', 'suspended', 'deleted');
CREATE TYPE message_kind AS ENUM ('text', 'image', 'file', 'gift', 'system');
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'edited', 'deleted', 'blocked');
CREATE TYPE wallet_owner_type AS ENUM ('site', 'user', 'agent');
CREATE TYPE ledger_direction AS ENUM ('credit', 'debit');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id integer,
  username varchar(64) NOT NULL,
  display_name varchar(120) NOT NULL,
  password_hash text,
  role account_role NOT NULL DEFAULT 'member',
  status account_status NOT NULL DEFAULT 'active',
  avatar_url text,
  cover_url text,
  country_code varchar(16),
  locale varchar(16) DEFAULT 'ar',
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

CREATE UNIQUE INDEX users_username_idx ON users (username);
CREATE INDEX users_legacy_id_idx ON users (legacy_id);
CREATE INDEX users_status_idx ON users (status);

CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  idreg varchar(32) NOT NULL,
  lid varchar(64) NOT NULL,
  uid varchar(64) NOT NULL,
  profile_msg text NOT NULL,
  avatar_url text NOT NULL DEFAULT '/pic.png',
  banner_url text NOT NULL DEFAULT '/pich.png',
  theme_id varchar(80) NOT NULL DEFAULT '',
  avatar_frame_url text NOT NULL DEFAULT '',
  gift_icon_url text NOT NULL DEFAULT '',
  profile_icon_url text NOT NULL DEFAULT '',
  name_gradient text NOT NULL DEFAULT '',
  name_effect_id varchar(80) NOT NULL DEFAULT '',
  message_bubble_style varchar(64) NOT NULL DEFAULT 'default',
  profile_accent_color varchar(32) NOT NULL DEFAULT '#2563EB',
  profile_background_url text NOT NULL DEFAULT '',
  background_color varchar(32) NOT NULL DEFAULT '#FFFFFF',
  message_color varchar(32) NOT NULL DEFAULT '#000000',
  name_color varchar(32) NOT NULL DEFAULT '#000000',
  gradient_color varchar(32) NOT NULL DEFAULT '#FFFFFF',
  evaluation integer NOT NULL DEFAULT 0,
  rep bigint NOT NULL DEFAULT 0,
  coins bigint NOT NULL DEFAULT 0,
  wall_post_likes bigint NOT NULL DEFAULT 0,
  gifts_received_count bigint NOT NULL DEFAULT 0,
  power varchar(120) NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',
  is_login varchar(32) NOT NULL DEFAULT 'عضو',
  muted boolean NOT NULL DEFAULT false,
  documents boolean NOT NULL DEFAULT false,
  busy boolean NOT NULL DEFAULT false,
  alerts boolean NOT NULL DEFAULT false,
  nopmcall boolean NOT NULL DEFAULT false,
  nopmvideocall boolean NOT NULL DEFAULT false,
  room_id varchar(128) NOT NULL DEFAULT 'general',
  site_badge_id varchar(128) NOT NULL DEFAULT '',
  site_badge text NOT NULL DEFAULT '',
  joinuser bigint NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX user_profiles_uid_idx ON user_profiles (uid);
CREATE UNIQUE INDEX user_profiles_idreg_idx ON user_profiles (idreg);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  device_fingerprint text,
  ip_address varchar(64),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE UNIQUE INDEX sessions_refresh_token_hash_idx ON sessions (refresh_token_hash);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);

CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id varchar(128),
  slug varchar(128) NOT NULL,
  name varchar(160) NOT NULL,
  description text,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  avatar_url text,
  is_public boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  max_members integer NOT NULL DEFAULT 500,
  mic_slots integer NOT NULL DEFAULT 0,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX rooms_slug_idx ON rooms (slug);
CREATE INDEX rooms_legacy_id_idx ON rooms (legacy_id);
CREATE INDEX rooms_owner_id_idx ON rooms (owner_id);

CREATE TABLE room_members (
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role account_role NOT NULL DEFAULT 'member',
  is_muted boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX room_members_user_id_idx ON room_members (user_id);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id varchar(128),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reply_to_id uuid,
  kind message_kind NOT NULL DEFAULT 'text',
  status message_status NOT NULL DEFAULT 'sent',
  body text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

CREATE UNIQUE INDEX messages_client_id_idx ON messages (client_id);
CREATE INDEX messages_room_created_idx ON messages (room_id, created_at);
CREATE INDEX messages_sender_id_idx ON messages (sender_id);

CREATE TABLE wall_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_bid varchar(128),
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  body text,
  media_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX wall_posts_author_id_idx ON wall_posts (author_id);
CREATE INDEX wall_posts_created_at_idx ON wall_posts (created_at);

CREATE TABLE wall_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES wall_posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  parent_id uuid,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX wall_comments_post_id_idx ON wall_comments (post_id);
CREATE INDEX wall_comments_parent_id_idx ON wall_comments (parent_id);

CREATE TABLE follows (
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX follows_following_id_idx ON follows (following_id);

CREATE TABLE stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type varchar(32) NOT NULL DEFAULT 'image',
  caption text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX stories_author_id_idx ON stories (author_id);
CREATE INDEX stories_expires_at_idx ON stories (expires_at);

CREATE TABLE gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  image_url text NOT NULL,
  category varchar(80) NOT NULL DEFAULT 'default',
  price_coins bigint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gifts_is_active_idx ON gifts (is_active);

CREATE TABLE wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type wallet_owner_type NOT NULL,
  owner_id uuid,
  balance_coins bigint NOT NULL DEFAULT 0,
  reserved_coins bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX wallets_owner_idx ON wallets (owner_type, owner_id);

CREATE TABLE wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  txid varchar(128) NOT NULL,
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  direction ledger_direction NOT NULL,
  event_type varchar(80) NOT NULL,
  amount_coins bigint NOT NULL,
  before_balance bigint NOT NULL,
  after_balance bigint NOT NULL,
  counterparty_wallet_id uuid,
  reference_type varchar(80),
  reference_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX wallet_ledger_txid_idx ON wallet_ledger (txid);
CREATE INDEX wallet_ledger_wallet_id_idx ON wallet_ledger (wallet_id);
CREATE INDEX wallet_ledger_created_at_idx ON wallet_ledger (created_at);

CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  code varchar(64) NOT NULL,
  name varchar(160) NOT NULL,
  country_code varchar(16),
  city varchar(160),
  phone varchar(64),
  commission_type varchar(32) NOT NULL DEFAULT 'wallet_transfer',
  commission_value numeric(18,4) NOT NULL DEFAULT 0,
  can_receive_orders boolean NOT NULL DEFAULT true,
  status account_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX agents_code_idx ON agents (code);
CREATE INDEX agents_user_id_idx ON agents (user_id);

CREATE TABLE moderation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  event_type varchar(80) NOT NULL,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX moderation_events_target_user_id_idx ON moderation_events (target_user_id);
CREATE INDEX moderation_events_room_id_idx ON moderation_events (room_id);
