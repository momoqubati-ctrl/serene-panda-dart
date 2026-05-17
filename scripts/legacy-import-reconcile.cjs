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

async function countTable(client, table) {
  const result = await client.query(`select count(*)::int as count from ${table}`);
  return result.rows[0].count;
}

async function main() {
  const pool = getPool();
  try {
    const client = await pool.connect();
    try {
      const tables = [
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

      console.log("Counts:");
      for (const table of tables) {
        console.log(`${table}: ${await countTable(client, table)}`);
      }

      const batches = await client.query(
        `select id, status, started_at, finished_at, summary
         from legacy_import_batches
         order by started_at desc
         limit 5`,
      );
      console.log("Recent batches:");
      console.log(JSON.stringify(batches.rows, null, 2));

      const columns = await client.query(
        `select table_name, column_name, data_type
         from information_schema.columns
         where table_schema = 'public'
           and table_name in ('users', 'user_profiles', 'wallets', 'rooms', 'gifts')
         order by table_name, ordinal_position`,
      );
      console.log("Target columns:");
      console.log(JSON.stringify(columns.rows, null, 2));

      const active = await client.query(
        `select state, wait_event_type, wait_event, left(query, 160) as query
         from pg_stat_activity
         where datname = current_database()
           and pid <> pg_backend_pid()
           and state <> 'idle'
         order by query_start desc
         limit 10`,
      );
      console.log("Active queries:");
      console.log(JSON.stringify(active.rows, null, 2));
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
