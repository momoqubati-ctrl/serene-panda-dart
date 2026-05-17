#!/usr/bin/env node
/* eslint-disable no-console */

const { Pool } = require("pg");
require("dotenv").config();

const ddl = [
  {
    name: "site_settings",
    sql: `CREATE TABLE IF NOT EXISTS site_settings (
      key varchar(120) PRIMARY KEY,
      value jsonb NOT NULL DEFAULT '{}'::jsonb,
      updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "legacy_import_batches",
    sql: `CREATE TABLE IF NOT EXISTS legacy_import_batches (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      source_name varchar(160) NOT NULL,
      source_database varchar(160) NOT NULL DEFAULT 'safarihost',
      dump_completed_at timestamptz,
      status varchar(40) NOT NULL DEFAULT 'draft',
      summary jsonb NOT NULL DEFAULT '{}'::jsonb,
      started_at timestamptz NOT NULL DEFAULT now(),
      finished_at timestamptz
    )`,
  },
  {
    name: "legacy_import_mappings",
    sql: `CREATE TABLE IF NOT EXISTS legacy_import_mappings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_id uuid REFERENCES legacy_import_batches(id) ON DELETE CASCADE,
      legacy_table varchar(120) NOT NULL,
      legacy_column varchar(120) NOT NULL,
      target_table varchar(120) NOT NULL,
      target_column varchar(120),
      mapping_strategy text NOT NULL,
      note text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "roles",
    sql: `CREATE TABLE IF NOT EXISTS roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      legacy_name varchar(120),
      name varchar(120) NOT NULL,
      rank integer NOT NULL DEFAULT 0,
      icon_url text NOT NULL DEFAULT '',
      is_system boolean NOT NULL DEFAULT false,
      auto_enabled boolean NOT NULL DEFAULT false,
      auto_promote boolean NOT NULL DEFAULT false,
      auto_points integer NOT NULL DEFAULT 0,
      legacy_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "role_permissions",
    sql: `CREATE TABLE IF NOT EXISTS role_permissions (
      role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_key varchar(120) NOT NULL,
      permission_value jsonb NOT NULL DEFAULT 'true'::jsonb,
      source varchar(40) NOT NULL DEFAULT 'legacy_powers',
      PRIMARY KEY (role_id, permission_key)
    )`,
  },
  {
    name: "user_role_assignments",
    sql: `CREATE TABLE IF NOT EXISTS user_role_assignments (
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
      starts_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz,
      legacy_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      PRIMARY KEY (user_id, role_id)
    )`,
  },
  {
    name: "site_assets",
    sql: `CREATE TABLE IF NOT EXISTS site_assets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      asset_type varchar(40) NOT NULL,
      name varchar(160) NOT NULL DEFAULT '',
      file_url text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0,
      is_active boolean NOT NULL DEFAULT true,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "site_badges",
    sql: `CREATE TABLE IF NOT EXISTS site_badges (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      legacy_badge_id varchar(128),
      name varchar(160) NOT NULL,
      background text NOT NULL DEFAULT '',
      icon_url text NOT NULL DEFAULT '',
      background_type varchar(40) NOT NULL DEFAULT 'static',
      is_active boolean NOT NULL DEFAULT true,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "room_badges",
    sql: `CREATE TABLE IF NOT EXISTS room_badges (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      legacy_badge_id varchar(128),
      name varchar(160) NOT NULL,
      background text NOT NULL DEFAULT '',
      icon_url text NOT NULL DEFAULT '',
      background_type varchar(40) NOT NULL DEFAULT 'static',
      is_active boolean NOT NULL DEFAULT true,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  },
];

const indexes = [
  "CREATE UNIQUE INDEX IF NOT EXISTS legacy_import_mappings_unique_idx ON legacy_import_mappings (legacy_table, legacy_column, target_table, coalesce(target_column, ''))",
  "CREATE UNIQUE INDEX IF NOT EXISTS roles_name_idx ON roles (name)",
  "CREATE INDEX IF NOT EXISTS roles_rank_idx ON roles (rank)",
  "CREATE INDEX IF NOT EXISTS site_assets_type_active_idx ON site_assets (asset_type, is_active)",
  "CREATE UNIQUE INDEX IF NOT EXISTS site_badges_legacy_idx ON site_badges (legacy_badge_id)",
  "CREATE UNIQUE INDEX IF NOT EXISTS room_badges_legacy_idx ON room_badges (legacy_badge_id)",
];

const alterations = [
  "ALTER TABLE legacy_import_mappings ALTER COLUMN mapping_strategy TYPE text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS requires_password_reset boolean NOT NULL DEFAULT false",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_metadata jsonb NOT NULL DEFAULT '{}'::jsonb",
  "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS legacy_metadata jsonb NOT NULL DEFAULT '{}'::jsonb",
  "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS legacy_metadata jsonb NOT NULL DEFAULT '{}'::jsonb",
];

function parseArgs(argv) {
  return { apply: argv.includes("--apply") };
}

function getPool() {
  let connectionString = process.env.DATABASE_URL || "";
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }
  if (connectionString.includes("sslmode=")) {
    connectionString = connectionString.replace(/[?&]sslmode=[^&]+/, "");
  }

  return new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL?.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
  });
}

async function getExistingTables(client) {
  const result = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public'",
  );
  return new Set(result.rows.map((row) => row.table_name));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const pool = getPool();
  const client = await pool.connect();

  try {
    const existing = await getExistingTables(client);
    const missing = ddl.filter((item) => !existing.has(item.name));

    console.log(`Mode: ${args.apply ? "apply" : "dry-run"}`);
    console.log(`Missing legacy import tables: ${missing.length}`);
    console.log(missing.map((item) => item.name).join("\n") || "NONE");

    if (!args.apply) return;

    await client.query("BEGIN");
    try {
      for (const item of missing) {
        await client.query(item.sql);
      }
      for (const sql of alterations) {
        await client.query(sql);
      }
      for (const sql of indexes) {
        await client.query(sql);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    console.log(`Created or verified tables: ${ddl.length}`);
    console.log(`Verified column alterations: ${alterations.length}`);
    console.log(`Created or verified indexes: ${indexes.length}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
