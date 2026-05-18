import { config } from "dotenv";
config();
import { dbPool } from "./server/db/index";

async function run() {
  try {
    const res = await dbPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log("Columns of users:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
run();
