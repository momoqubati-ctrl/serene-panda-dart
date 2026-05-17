import { defineEventHandler, setResponseStatus } from "h3";
import { dbPool } from "../../../db";
import { getAdminContext } from "../../../services/adminAccess";

export default defineEventHandler(async (event) => {
  const admin = getAdminContext(event);
  if (!admin.ok) {
    setResponseStatus(event, admin.statusCode);
    return { success: false, message: admin.message };
  }

  const rolesResult = await dbPool.query(
    `SELECT
       r.id,
       r.legacy_name AS name,
       r.rank,
       r.icon_url AS ico,
       r.auto_enabled,
       r.auto_promote,
       r.auto_points,
       r.raw,
       COALESCE(jsonb_object_agg(rp.permission_key, rp.permission_value) FILTER (WHERE rp.permission_key IS NOT NULL), '{}'::jsonb) AS permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     GROUP BY r.id
     ORDER BY r.rank DESC, r.legacy_name ASC`,
  );

  return {
    success: true,
    roles: rolesResult.rows
  };
});
