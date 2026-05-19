import { config } from "dotenv";
config();
import { dbPool } from "./server/db/index";

async function run() {
  try {
    const res = await dbPool.query(`
      SELECT id, username, idreg 
      FROM public.users 
      LIMIT 10
    `);
    console.log("Sample users data:", res.rows);

    const countRes = await dbPool.query(`
      SELECT 
        COUNT(*) as total, 
        COUNT(id) as non_null_id, 
        COUNT(DISTINCT id) as unique_id 
      FROM public.users
    `);
    console.log("Users statistics:", countRes.rows[0]);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
run();
