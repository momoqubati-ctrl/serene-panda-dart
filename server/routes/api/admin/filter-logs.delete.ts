import { defineEventHandler, setResponseStatus } from "h3";
import { dbPool } from "../../../db";
import { guardAdminAction, logAdminAudit } from "../../../services/adminPermissions";

export default defineEventHandler(async (event) => {
  try {
    const admin = await guardAdminAction(event, "flter");

    await dbPool.query("TRUNCATE TABLE histletter");

    await logAdminAudit({
      actorId: admin.userId,
      action: "filter.logs.clear",
      targetType: "system",
      targetId: "histletter"
    });

    return { success: true, message: "تم تفريغ سجل الرصد بنجاح" };
  } catch (error: any) {
    setResponseStatus(event, 500);
    return { success: false, message: error.message };
  }
});