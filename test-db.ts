import { config } from "dotenv";
config();
import { db } from "./server/db/index";
import { rooms } from "./server/db/schema";
import { eq } from "drizzle-orm";

async function test() {
  try {
    console.log("Testing listRooms query...");
    const dbRooms = await db.select().from(rooms).where(eq(rooms.isDeleted, false));
    console.log("Success! Rooms count:", dbRooms.length);
  } catch (err: any) {
    console.error("Query failed with error:", err.message || err);
    if (err.cause) {
      console.error("Cause:", err.cause);
    }
  }
  process.exit(0);
}
test();
