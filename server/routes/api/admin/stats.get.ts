import { defineEventHandler, setResponseStatus } from "h3";
import { dbPool } from "../../../db";
import { getAdminContext } from "../../../services/adminAccess";

export default defineEventHandler(async (event) => {
  const admin = getAdminContext(event);
  if (!admin.ok) {
    setResponseStatus(event, admin.statusCode);
    return { success: false, message: admin.message };
  }

  try {
    const [usersCount, bannedCount, roomsCount, reportsCount] = await Promise.all([
      dbPool.query("SELECT count(*)::int AS value FROM users"),
      dbPool.query("SELECT count(*)::int AS value FROM band"),
      dbPool.query("SELECT count(*)::int AS value FROM rooms WHERE COALESCE(deleted, 0) = 0"),
      dbPool.query("SELECT count(*)::int AS value FROM stats"),
    ]);

    return {
      success: true,
      stats: {
        users: usersCount.rows[0]?.value || 0,
        banned: bannedCount.rows[0]?.value || 0,
        rooms: roomsCount.rows[0]?.value || 0,
        reports: reportsCount.rows[0]?.value || 0,
      }
    };
  } catch (err: any) {
    console.error("Admin stats error:", err);
    return { success: false, error: err.message };
  }
});
