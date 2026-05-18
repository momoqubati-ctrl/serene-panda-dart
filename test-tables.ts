import { config } from "dotenv";
config();
import { dbPool } from "./server/db/index";

async function run() {
  try {
    const res = await dbPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables:", res.rows.map(r => r.table_name));
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
run();
