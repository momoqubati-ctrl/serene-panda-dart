import { config } from "dotenv";
config();
import { dbPool } from "./server/db/index";

async function run() {
  try {
    const res = await dbPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'idreg'
    `);
    console.log("idreg exists:", res.rows.length > 0);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
run();
