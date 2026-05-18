import { config } from "dotenv";
config();
import { dbPool } from "./server/db/index";

async function run() {
  try {
    const res = await dbPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('avatar_url', 'avatar', 'pic', 'ico')
    `);
    console.log("Avatar columns:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
run();
