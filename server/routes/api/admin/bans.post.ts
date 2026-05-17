import { defineEventHandler, readBody } from "h3";
import { dbPool } from "../../../db";
import { guardAdminAction, logAdminAudit } from "../../../services/adminPermissions";

export default defineEventHandler(async (event) => {
  try {
    const admin = await guardAdminAction(event, "ban");
    const body = await readBody(event);

    const { targetName, type, value, reason, expiresAt, expiresLabel } = body;

    if (!targetName || !type || !value) {
      throw new Error("البيانات المطلوبة ناقصة");
    }

    const result = await dbPool.query(
      `INSERT INTO moderation_bans 
        (target_name, ban_type, decoder_code, expires_at, expires_label, created_by, is_active)
       VALUES ($1, $2, $3, $4, $5, (SELECT id FROM users WHERE idreg = $6 OR id::text = $6 LIMIT 1), true)
       RETURNING id`,
      [targetName, type, value, expiresAt || null, expiresLabel || "دائم", admin.userId]
    );

    await logAdminAudit({
      actorId: admin.userId,
      action: "ban.create",
      targetType: "user",
      targetId: targetName,
      metadata: { type, value, reason }
    });

    return { success: true, message: "تم الحظر بنجاح", banId: result.rows[0].id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});