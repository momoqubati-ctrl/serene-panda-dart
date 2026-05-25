#!/usr/bin/env node
const fs = require('fs');
require('dotenv').config();
const { Client } = require('pg');

function usage() {
  console.error('Usage: node scripts/backfill-users.cjs <id1> <id2> ...');
  console.error('       node scripts/backfill-users.cjs --file missing_ids.txt');
  process.exit(1);
}

const argv = process.argv.slice(2);
if (argv.length === 0) usage();

let ids = [];
if (argv[0] === '--file') {
  if (!argv[1]) usage();
  const file = argv[1];
  const raw = fs.readFileSync(file, 'utf8');
  ids = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
} else {
  ids = argv.slice();
}

if (ids.length === 0) {
  console.error('No IDs provided.');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

async function getRequiredColumns() {
  const q = `
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND is_nullable = 'NO'
      AND column_default IS NULL
      AND column_name <> 'id'
  `;
  const res = await client.query(q);
  return res.rows; // [{column_name, data_type}, ...]
}

function defaultFor(column, data_type, short) {
  const name = column.toLowerCase();
  if (name.includes('username')) return `guest_${short}`;
  if (name.includes('display') || name.includes('name')) return `Guest ${short}`;
  if (name.includes('role')) return 'member';
  if (name.includes('status')) return 'active';
  if (name.includes('presence')) return 'online';
  if (data_type && data_type.includes('timestamp')) return new Date().toISOString();
  if (data_type && (data_type.includes('int') || data_type.includes('numeric'))) return 0;
  if (data_type && data_type.includes('boolean')) return false;
  return '';
}

(async () => {
  try {
    await client.connect();
    const required = await getRequiredColumns();
    for (const id of ids) {
      const short = id.replace(/-/g, '').substring(0, 8);
      const cols = ['id'];
      const vals = [id];
      const placeholders = ['$1'];
      let idx = 2;
      for (const r of required) {
        const col = r.column_name;
        const def = defaultFor(col, r.data_type, short);
        cols.push(col);
        vals.push(def);
        placeholders.push(`$${idx}`);
        idx++;
      }

      const sql = `INSERT INTO users (${cols.join(',')}) VALUES (${placeholders.join(',')}) ON CONFLICT (id) DO NOTHING`;
      await client.query(sql, vals);
      console.log('Upserted', id);
    }
    console.log(`Backfill complete (${ids.length} ids processed).`);
  } catch (err) {
    console.error('Error running backfill:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
