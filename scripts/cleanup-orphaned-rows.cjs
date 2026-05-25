#!/usr/bin/env node
require('dotenv').config();
const { Client } = require('pg');

const argv = require('minimist')(process.argv.slice(2));
const dryRun = !!argv['dry-run'] || !!argv['dryrun'] || !argv.yes;
const confirm = !!argv.yes || !!argv.y;

const tables = [
  { table: 'profile_visits', cols: ['visitor_id', 'profile_id'] },
  { table: 'social_edges', cols: ['source_id', 'target_id'] },
  { table: 'activity_stream', cols: ['actor_id'] },
  { table: 'user_profiles', cols: ['user_id'] },
];

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  console.log(dryRun ? 'Running in dry-run mode (no deletes will be executed).' : 'Will perform deletions.');

  for (const t of tables) {
    const conditions = t.cols.map(col => `(NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ${col}) AND ${col} IS NOT NULL)`).join(' OR ');
    const countQ = `SELECT COUNT(*) AS cnt FROM ${t.table} WHERE ${conditions}`;
    try {
      const res = await c.query(countQ);
      const cnt = parseInt(res.rows[0].cnt, 10);
      console.log(`Table ${t.table}: ${cnt} orphaned row(s) referencing missing users.`);
      if (cnt > 0) {
        const sample = await c.query(`SELECT * FROM ${t.table} WHERE ${conditions} LIMIT 10`);
        console.log('Sample rows:', sample.rows);
        if (!dryRun) {
          // perform delete inside transaction
          try {
            await c.query('BEGIN');
            const delQ = `DELETE FROM ${t.table} WHERE ${conditions}`;
            const delRes = await c.query(delQ);
            await c.query('COMMIT');
            console.log(`Deleted ${delRes.rowCount} rows from ${t.table}`);
          } catch (e) {
            await c.query('ROLLBACK');
            console.error(`Failed to delete from ${t.table}:`, e.message || e);
          }
        }
      }
    } catch (e) {
      console.error(`Error checking table ${t.table}:`, e.message || e);
    }
  }

  await c.end();
  console.log('Done.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
