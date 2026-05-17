import { defineEventHandler, setResponseStatus } from "h3";
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

  const legacy = await dbPool.query("SELECT * FROM settings ORDER BY id LIMIT 1");
  const owner = await dbPool.query("SELECT * FROM owner ORDER BY id LIMIT 1");
  const siteRow = legacy.rows[0] || {};
  const site = parseJson(siteRow.site, {});
  const ownerRow = owner.rows[0] || {};

  return {
    success: true,
    settings: {
      siteName: site.siteName || "دردشة عربية",
      welcomeMessage: site.welcomeMessage || siteRow.adresse || "أهلاً بك في الدردشة",
      allowGuests: site.allowg !== false,
      maintenanceMode: Boolean(ownerRow.offline),
      maxMessageLength: Number(parseJson(site.walllikes, {})?.lengthMsgRoom || 250),
      maxAccountsPerIp: Number(ownerRow.MaxRep || 3),
      blockVpn: Boolean(ownerRow.Vpn),
      roomCreationEnabled: Boolean(ownerRow.rc),
      publicWallEnabled: Boolean(ownerRow.bars),
      storiesEnabled: true,
      giftsEnabled: true,
      botsEnabled: true,
      legacySite: site,
    },
  };
});
