import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/chat_app",
});

export const db = drizzle(pool, { schema });

export const checkDatabaseConnection = async () => {
  try {
    await pool.query("select 1");
    return {
      connected: true,
      message: "قاعدة البيانات متصلة",
    };
  } catch {
    return {
      connected: false,
      message: "قاعدة البيانات غير متصلة",
    };
  }
};
