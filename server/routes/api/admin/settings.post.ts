import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { dbPool } from "../../../db";
import { getAdminContext } from "../../../services/adminAccess";

const parseJson = (value: unknown, fallback: any) => {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export default defineEventHandler(async (event) => {
  const admin = getAdminContext(event);
  if (!admin.ok) {
    setResponseStatus(event, admin.statusCode);
    return { success: false, message: admin.message };
  }

  const body = await readBody(event);
  const existing = await dbPool.query("SELECT id, site FROM settings ORDER BY id LIMIT 1");
  const current = parseJson(existing.rows[0]?.site, {});
  const walllikes = parseJson(current.walllikes, {});
  const next = {
    ...current,
    siteName: String(body?.siteName || current.siteName || "دردشة عربية").slice(0, 80),
    welcomeMessage: String(body?.welcomeMessage || current.welcomeMessage || "أهلاً بك في الدردشة").slice(0, 240),
    allowg: body?.allowGuests !== false,
    walllikes: JSON.stringify({
      ...walllikes,
      lengthMsgRoom: String(Number(body?.maxMessageLength) || Number(walllikes.lengthMsgRoom) || 250),
    }),
  };

  if (existing.rows[0]?.id) {
    await dbPool.query("UPDATE settings SET site = $1 WHERE id = $2", [JSON.stringify(next), existing.rows[0].id]);
  }
  await dbPool.query(
    `UPDATE owner SET "Vpn" = $1, "MaxRep" = $2, rc = $3, bars = $4, offline = $5 WHERE id = 1`,
    [
      body?.blockVpn ? 1 : 0,
      Number(body?.maxAccountsPerIp) || 3,
      body?.roomCreationEnabled === false ? 0 : 1,
      body?.publicWallEnabled === false ? 0 : 1,
      body?.maintenanceMode ? 1 : 0,
    ],
  );

  return {
    success: true,
    message: "تم حفظ إعدادات الشات",
    settings: {
      ...body,
      siteName: next.siteName,
      welcomeMessage: next.welcomeMessage,
      maxMessageLength: Number(body?.maxMessageLength) || 250,
      maxAccountsPerIp: Number(body?.maxAccountsPerIp) || 3,
    },
  };
});
