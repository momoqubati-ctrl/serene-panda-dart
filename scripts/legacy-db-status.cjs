#!/usr/bin/env node
/* eslint-disable no-console */

const { Pool } = require("pg");
require("dotenv").config();

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

async function main() {
  const pool = getPool();
  try {
    const tables = await pool.query(
      "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
    );
    const types = await pool.query(
      "select typname from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' order by typname",
    );

    const tableNames = tables.rows.map((row) => row.table_name);
    const typeNames = types.rows.map((row) => row.typname);
    const requiredTables = [
      "users",
      "user_profiles",
      "wallets",
      "roles",
      "role_permissions",
      "user_role_assignments",
      "rooms",
      "site_settings",
      "site_assets",
      "gifts",
      "site_badges",
      "room_badges",
      "legacy_import_batches",
      "legacy_import_mappings",
    ];

    console.log(`Public tables: ${tableNames.length}`);
    console.log(tableNames.length ? tableNames.join("\n") : "NO_TABLES");
    console.log(`Public types: ${typeNames.length}`);
    console.log(typeNames.length ? typeNames.join("\n") : "NO_TYPES");
    console.log("Missing required tables:");
    console.log(requiredTables.filter((table) => !tableNames.includes(table)).join("\n") || "NONE");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
