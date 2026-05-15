import { defineEventHandler } from "h3";
import { checkDatabaseConnection } from "../../db";

export default defineEventHandler(async () => {
  const database = await checkDatabaseConnection();

  return {
    ok: true,
    service: "global-chat",
    status: "ready",
    database,
    timestamp: new Date().toISOString(),
  };
});
