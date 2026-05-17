import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
config();

let connectionString = process.env.DATABASE_URL || "";
if (connectionString.includes("sslmode=")) {
  connectionString = connectionString.replace(/[?&]sslmode=[^&]+/, "");
}

export default defineConfig({
  schema: "./server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
    ssl: process.env.DATABASE_URL?.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
  },
});
