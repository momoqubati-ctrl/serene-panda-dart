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
  const name = String(body?.name || "").trim();
  if (!name) {
    setResponseStatus(event, 400);
    return { success: false, message: "اسم البوت مطلوب" };
  }
  const botKey = String(body?.botKey || `bot-${Date.now()}`).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const inserted = await dbPool.query(
    `INSERT INTO bots (msg, pic, power, country, room, ip, id, stat, topic)
     VALUES ($1, $2, '', '', '', '', $3, $4, $5)
     RETURNING idreg AS id, id AS "botKey", topic AS name, msg AS description, pic AS "avatarUrl", stat <> 0 AS "isActive"`,
    [
      String(body?.description || "مرحبا بكم").slice(0, 255),
      String(body?.avatarUrl || "pic.png").slice(0, 255),
      botKey,
      body?.isActive === false ? 0 : 1,
      name.slice(0, 255),
    ],
  );

  return { success: true, bot: inserted.rows[0], message: "تم إنشاء البوت" };
});
