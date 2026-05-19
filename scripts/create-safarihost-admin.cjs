#!/usr/bin/env node
/* eslint-disable no-console */

const { randomUUID, scryptSync } = require("node:crypto");
const { Pool } = require("pg");
require("dotenv").config();

const username = "Safarihost";
const password = "Safari2026*-*-";

function hashPassword(value) {
  const salt = randomUUID().replaceAll("-", "");
  const hash = scryptSync(value, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function connection() {
  let connectionString = process.env.DATABASE_URL || "";
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  if (connectionString.includes("sslmode=")) {
    connectionString = connectionString.replace(/[?&]sslmode=[^&]+/, "");
  }
  return new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL?.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
  });
}

async function main() {
  const pool = connection();
  const client = await pool.connect();
  try {
    const now = String(Date.now());
    const uid = randomUUID().replaceAll("-", "").slice(0, 22);
    const lid = randomUUID().replaceAll("-", "").slice(0, 31);
    const token = randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", "");
    const passwordHash = hashPassword(password);

    const existing = await client.query("SELECT idreg FROM users WHERE lower(username) = lower($1) LIMIT 1", [username]);
    let idreg;
    if ((existing.rowCount || 0) > 0) {
      const updated = await client.query(
        `UPDATE users
         SET username = $1,
             topic = $1,
             power = 'owner',
             password = $2,
             documentationc = 1,
             muted = 0,
             lastssen = $3
         WHERE idreg = $4
         RETURNING idreg, username, topic, power`,
        [username, passwordHash, now, existing.rows[0].idreg],
      );
      idreg = updated.rows[0].idreg;
      console.log(JSON.stringify({ action: "updated", user: updated.rows[0] }, null, 2));
    } else {
      const inserted = await client.query(
        `INSERT INTO users
          (bg, mcol, ucol, evaluation, ico, ip, fp, id, lid, uid, msg, pic, pich, power, rep, topic, username, password, token, youtub, them, cover, "loginG", muted, documentationc, lastssen, joinuser, site_badge_id, site_badge, coins, gift_ico, gcol, last_eval_login_day, auto_power, wall_post_likes, gifts_received_count, eval_awards_json)
         VALUES
          ('#FFFFFF', '#000000', '#000000', 0, '', '', '', '', $1, $2, '(عضو جديد)', 'pic.png', 'pich.png', 'owner', 0, $3, $3, $4, $5, '', '', '', 0, 0, 1, $6, $6, '', '', 0, '', '#FFFFFF', '', '', 0, 0, NULL)
         RETURNING idreg, username, topic, power`,
        [lid, uid, username, passwordHash, token, now],
      );
      idreg = inserted.rows[0].idreg;
      console.log(JSON.stringify({ action: "created", user: inserted.rows[0] }, null, 2));
    }

    // Assign 'ispower' role (Owner / General Manager)
    const roleRes = await client.query("SELECT id FROM roles WHERE legacy_name = 'ispower' OR name = 'ispower' LIMIT 1");
    if (roleRes.rowCount > 0) {
      const roleId = roleRes.rows[0].id;
      await client.query(
        `INSERT INTO user_role_assignments (user_idreg, role_id, power_name)
         VALUES ($1, $2, 'ispower')
         ON CONFLICT (user_idreg, role_id) DO NOTHING`,
        [idreg, roleId]
      );
      console.log(`Assigned user idreg ${idreg} to role 'ispower' (role_id ${roleId})`);
    } else {
      console.warn("Role 'ispower' not found in roles table. Cannot assign permissions.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
