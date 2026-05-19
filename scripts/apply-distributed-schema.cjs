#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
require("dotenv").config();

const SCHEMA_FILE = path.join(__dirname, "../database/distributed-social-infra.postgres.sql");

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
  if (!fs.existsSync(SCHEMA_FILE)) {
    throw new Error(`Schema file not found at ${SCHEMA_FILE}`);
  }

  console.log("Reading schema file...");
  const sql = fs.readFileSync(SCHEMA_FILE, "utf8");

  console.log("Connecting to database...");
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log("Executing SQL schema...");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Distributed social infrastructure schema applied successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
