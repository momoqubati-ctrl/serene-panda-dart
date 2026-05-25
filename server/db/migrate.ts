import { dbPool } from "./index";

/**
 * Auto-migration: يُنشئ الجداول الناقصة تلقائياً عند تشغيل السيرفر.
 * آمن للتشغيل المتكرر (يستخدم IF NOT EXISTS).
 */
export async function runAutoMigrations() {
  const client = await dbPool.connect();
  try {
    console.log("[Migration] بدء فحص الجداول الناقصة...");

    // 1. إنشاء أنواع الـ Enum أولاً إذا لم تكن موجودة
    const enumQueries = [
      `DO $$ BEGIN CREATE TYPE "account_role" AS ENUM ('guest','member','moderator','owner','admin','agent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE "account_status" AS ENUM ('active','muted','banned','suspended','deleted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE "edge_type" AS ENUM ('friend','follow','block','mute','mutual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE "presence_status" AS ENUM ('online','idle','lurking','active','multitasking'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    ];
    for (const q of enumQueries) {
      await client.query(q).catch(() => { /* الـ enum موجود مسبقاً */ });
    }

    // 2. تفعيل إضافة pgcrypto لتوفير gen_random_uuid()
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // 3. التحقق وإضافة الأعمدة الناقصة في جدول users (لأن الجدول موجود مسبقاً وقد تنقصه أعمدة جديدة)
    await client.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "legacy_id" integer;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "display_name" varchar(120);
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "account_role" DEFAULT 'member';
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" "account_status" DEFAULT 'active';
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cover_url" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country_code" varchar(16);
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "presence" "presence_status" DEFAULT 'online';
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_active_at" timestamptz DEFAULT now();
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now();
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now();
    `);

    // 4. تعبئة قيم id الفارغة أو الـ NULL بـ UUID عشوائي
    await client.query(`
      UPDATE "users"
      SET "id" = gen_random_uuid()
      WHERE "id" IS NULL OR "id"::text = '';
    `);

    // 5. حل مشكلة قيم id المكررة (توليد UUID جديد للمكررات فقط والإبقاء على نسخة واحدة)
    await client.query(`
      UPDATE "users" u
      SET "id" = gen_random_uuid()
      FROM (
        SELECT idreg, ROW_NUMBER() OVER (PARTITION BY id ORDER BY idreg) as rn
        FROM "users"
        WHERE id IS NOT NULL
      ) dup
      WHERE u.idreg = dup.idreg AND dup.rn > 1;
    `);

    // 6. التأكد من وجود قيد فريد على حقل id في جدول users لتمكين الجداول الأخرى من الإشارة إليه كمفتاح خارجي
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE table_name='users' AND constraint_name='users_id_unique'
          ) THEN
              ALTER TABLE "users" ADD CONSTRAINT "users_id_unique" UNIQUE ("id");
          END IF;
      END $$;
    `);

    // --- 1. جدول user_profiles ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "user_id" varchar(255) PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
        "idreg" varchar(40),
        "lid" varchar(40),
        "uid" varchar(40),
        "profile_msg" text,
        "bio" text,
        "mood" varchar(120),
        "custom_status" text,
        "stealth" boolean DEFAULT false,
        "youtube_url" text,
        "autoplay_enabled" boolean DEFAULT false,
        "avatar_url" text,
        "banner_url" text,
        "theme_id" varchar(80),
        "avatar_frame_url" text,
        "gift_icon_url" text,
        "profile_icon_url" text,
        "name_gradient" text,
        "name_effect_id" varchar(80),
        "message_bubble_style" varchar(80),
        "profile_accent_color" varchar(20),
        "profile_background_url" text,
        "background_color" varchar(20),
        "message_color" varchar(20),
        "name_color" varchar(20),
        "gradient_color" varchar(20),
        "evaluation" integer DEFAULT 0,
        "rep" integer DEFAULT 0,
        "coins" integer DEFAULT 0,
        "wall_post_likes" integer DEFAULT 0,
        "gifts_received_count" integer DEFAULT 0,
        "power" varchar(80),
        "icon" text,
        "is_login" varchar(20),
        "muted" boolean DEFAULT false,
        "documents" boolean DEFAULT false,
        "busy" boolean DEFAULT false,
        "alerts" boolean DEFAULT true,
        "nopmcall" boolean DEFAULT false,
        "nopmvideocall" boolean DEFAULT false,
        "room_id" varchar(128),
        "site_badge_id" varchar(80),
        "site_badge" text,
        "joinuser" bigint,
        "updated_at" timestamptz DEFAULT now()
      );
    `);

    // إنشاء سجل بروفايل فارغ لكل مستخدم ليس لديه بروفايل بعد
    await client.query(`
      INSERT INTO "user_profiles" ("user_id")
      SELECT "id" FROM "users" u
      WHERE NOT EXISTS (
        SELECT 1 FROM "user_profiles" p WHERE p."user_id" = u."id"
      );
    `);

    // --- 2. جدول profile_visits (إعادة إنشائه ليتوافق مع Drizzle والأنواع الجديدة) ---
    await client.query(`
      DROP TABLE IF EXISTS "profile_visits" CASCADE;
      CREATE TABLE IF NOT EXISTS "profile_visits" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "visitor_id" varchar(255) REFERENCES "users"("id") ON DELETE CASCADE,
        "profile_id" varchar(255) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "visited_at" timestamptz DEFAULT now() NOT NULL,
        "hidden_visit" boolean DEFAULT false NOT NULL,
        "source" varchar(80)
      );
      CREATE INDEX IF NOT EXISTS "profile_visits_profile_idx" ON "profile_visits" ("profile_id");
      CREATE INDEX IF NOT EXISTS "profile_visits_visitor_idx" ON "profile_visits" ("visitor_id");
    `);

    // --- 3. جدول user_verifications ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_verifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" varchar(255) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" varchar(40) NOT NULL,
        "status" varchar(40) DEFAULT 'pending' NOT NULL,
        "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
        "verified_at" timestamptz,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "user_verifications_user_idx" ON "user_verifications" ("user_id");
    `);

    // --- 4. الجداول الأخرى من schema.ts ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "social_edges" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "source_id" varchar(255) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "target_id" varchar(255) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" varchar(20) NOT NULL,
        "weight" integer DEFAULT 1 NOT NULL,
        "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL,
        "updated_at" timestamptz DEFAULT now() NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "social_edges_pair_idx" ON "social_edges" ("source_id", "target_id", "type");
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "social_affinity" (
        "user_id" varchar(255) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "related_id" varchar(255) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "score" numeric(10,2) DEFAULT 0 NOT NULL,
        "interaction_count" integer DEFAULT 0 NOT NULL,
        "last_interaction_at" timestamptz,
        PRIMARY KEY ("user_id", "related_id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "identity_effects" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "slug" varchar(64) NOT NULL,
        "name" varchar(120) NOT NULL,
        "type" varchar(40) NOT NULL,
        "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
        "asset_url" text,
        "is_premium" boolean DEFAULT false NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "identity_effects_slug_idx" ON "identity_effects" ("slug");
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_identity_state" (
        "user_id" varchar(255) PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
        "active_frame_id" uuid REFERENCES "identity_effects"("id"),
        "active_aura_id" uuid REFERENCES "identity_effects"("id"),
        "active_theme_id" varchar(80),
        "custom_css" text,
        "reactive_config" jsonb DEFAULT '{}'::jsonb NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "behavior_scores" (
        "user_id" varchar(255) PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
        "trust_score" integer DEFAULT 50 NOT NULL,
        "toxicity_score" integer DEFAULT 0 NOT NULL,
        "influence_score" integer DEFAULT 0 NOT NULL,
        "spam_probability" numeric(4,3) DEFAULT 0 NOT NULL,
        "last_recalculated_at" timestamptz DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "activity_stream" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "actor_id" varchar(255) REFERENCES "users"("id") ON DELETE SET NULL,
        "verb" varchar(64) NOT NULL,
        "object_type" varchar(64) NOT NULL,
        "object_id" varchar(128),
        "target_id" varchar(128),
        "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
        "visibility" varchar(32) DEFAULT 'public' NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "activity_stream_actor_idx" ON "activity_stream" ("actor_id");
      CREATE INDEX IF NOT EXISTS "activity_stream_verb_idx" ON "activity_stream" ("verb");
      CREATE INDEX IF NOT EXISTS "activity_stream_created_idx" ON "activity_stream" ("created_at");
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "moderation_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "actor_id" varchar(255) REFERENCES "users"("id") ON DELETE SET NULL,
        "target_user_id" varchar(255) REFERENCES "users"("id") ON DELETE CASCADE,
        "room_id" uuid,
        "event_type" varchar(64) NOT NULL,
        "reason" text,
        "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "site_settings" (
        "key" varchar(120) PRIMARY KEY,
        "value" jsonb DEFAULT '{}'::jsonb NOT NULL,
        "updated_by" varchar(255) REFERENCES "users"("id") ON DELETE SET NULL,
        "updated_at" timestamptz DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "chat_bots" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "bot_key" varchar(80) NOT NULL,
        "name" varchar(120) NOT NULL,
        "description" text,
        "kind" varchar(60) NOT NULL,
        "avatar_url" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "chat_bots_key_idx" ON "chat_bots" ("bot_key");
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "moderation_filters" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "pattern" varchar(240) NOT NULL,
        "action" varchar(40) DEFAULT 'block' NOT NULL,
        "scope" varchar(40) DEFAULT 'global' NOT NULL,
        "severity" integer DEFAULT 1 NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "note" text,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "actor_id" varchar(255) REFERENCES "users"("id") ON DELETE SET NULL,
        "action" varchar(120) NOT NULL,
        "target_type" varchar(64),
        "target_id" varchar(128),
        "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "wall_posts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "author_id" varchar(255) REFERENCES "users"("id") ON DELETE CASCADE,
        "body" text,
        "media_url" text,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "wall_comments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "post_id" uuid REFERENCES "wall_posts"("id") ON DELETE CASCADE,
        "author_id" varchar(255) REFERENCES "users"("id") ON DELETE CASCADE,
        "body" text,
        "created_at" timestamptz DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "wall_post_likes" (
        "post_id" uuid REFERENCES "wall_posts"("id") ON DELETE CASCADE,
        "user_id" varchar(255) REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" timestamptz DEFAULT now() NOT NULL,
        PRIMARY KEY ("post_id", "user_id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "legacy_name" varchar(120),
        "name" varchar(120) NOT NULL,
        "rank" integer DEFAULT 0 NOT NULL,
        "icon_url" text DEFAULT '' NOT NULL,
        "is_system" boolean DEFAULT false NOT NULL,
        "auto_enabled" boolean DEFAULT false NOT NULL,
        "auto_promote" boolean DEFAULT false NOT NULL,
        "auto_points" integer DEFAULT 0 NOT NULL,
        "legacy_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
        "created_at" timestamptz DEFAULT now() NOT NULL,
        "updated_at" timestamptz DEFAULT now() NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_idx" ON "roles" ("name");
      CREATE INDEX IF NOT EXISTS "roles_rank_idx" ON "roles" ("rank");
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "permission_key" varchar(120) NOT NULL,
        "permission_value" jsonb DEFAULT 'true'::jsonb NOT NULL,
        "source" varchar(40) DEFAULT 'legacy_powers' NOT NULL,
        PRIMARY KEY ("role_id", "permission_key")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_role_assignments" (
        "user_id" varchar(255) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "assigned_by" varchar(255) REFERENCES "users"("id") ON DELETE SET NULL,
        "starts_at" timestamptz DEFAULT now() NOT NULL,
        "expires_at" timestamptz,
        "legacy_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
        PRIMARY KEY ("user_id", "role_id")
      );
    `);

    console.log("[Migration] ✅ تم فحص وإنشاء جميع الجداول الناقصة بنجاح");
  } catch (error) {
    console.error("[Migration] ❌ خطأ أثناء تشغيل الـ migrations:", error);
  } finally {
    client.release();
  }
}
