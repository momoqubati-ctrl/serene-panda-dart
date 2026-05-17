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
       id,
       v AS pattern,
       CASE WHEN path = 'wmsgs' THEN 'watch' ELSE 'block' END AS action,
       path AS scope,
       1 AS severity,
       type AS note,
       true AS "isActive"
     FROM notext
     ORDER BY id DESC
     LIMIT 500`,
  );

  return { success: true, filters: result.rows };
});
