import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { dbPool } from "../../../db";
import { getAdminContext } from "../../../services/adminAccess";

export default defineEventHandler(async (event) => {
  const admin = getAdminContext(event);
  if (!admin.ok) {
    setResponseStatus(event, admin.statusCode);
    return { success: false, message: admin.message };
  }

  const body = await readBody(event);
  const pattern = String(body?.pattern || "").trim();
  if (!pattern) {
    setResponseStatus(event, 400);
    return { success: false, message: "نص الفلتر مطلوب" };
  }
  const action = String(body?.action || "block");
  const path = action === "watch" ? "wmsgs" : "bmsgs";
  const type = action === "watch" ? "إضافة كلمة مراقبه الى الفلتر" : "إضافة كلمة ممنوعه الى الفلتر";

  const inserted = await dbPool.query(
    `INSERT INTO notext (type, path, v)
     VALUES ($1, $2, $3)
     RETURNING id, v AS pattern, $4::text AS action, path AS scope, 1 AS severity, type AS note, true AS "isActive"`,
    [type, path, pattern.slice(0, 255), action],
  );

  return { success: true, filter: inserted.rows[0], message: "تم إنشاء الفلتر" };
});
