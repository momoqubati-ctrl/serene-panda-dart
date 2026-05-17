import { defineEventHandler, setResponseStatus } from "h3";
import { dbPool } from "../../../db";
import { getAdminContext } from "../../../services/adminAccess";

export default defineEventHandler(async (event) => {
  const admin = getAdminContext(event);
  if (!admin.ok) {
    setResponseStatus(event, admin.statusCode);
    return { success: false, message: admin.message };
  }

  const result = await dbPool.query(
    `SELECT
       idreg AS id,
       id AS "botKey",
       topic AS name,
       msg AS description,
       'legacy_bot' AS kind,
       pic AS "avatarUrl",
       stat <> 0 AS "isActive",
       room,
       country,
       ip,
       power
     FROM bots
     ORDER BY idreg ASC
     LIMIT 500`,
  );

  return { success: true, bots: result.rows };
});
