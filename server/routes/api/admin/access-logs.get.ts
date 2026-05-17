import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import { dbPool } from "../../../db";
import { guardAdminAction } from "../../../services/adminPermissions";

export default defineEventHandler(async (event) => {
  try {
    await guardAdminAction(event, "cp");

    const query = getQuery(event);
    const search = String(query.search || "").trim();
    const limit = Math.min(Number(query.limit) || 150, 500); // الحد الأقصى الافتراضي 150 كما في النظام القديم

    let where = "";
    const params: any[] = [limit];

    if (search) {
      params.push(`%${search}%`);
      where = `WHERE state ILIKE $2 OR topic ILIKE $2 OR username ILIKE $2 OR ip ILIKE $2 OR device ILIKE $2`;
    }

    const result = await dbPool.query(
      `SELECT 
        id,
        state,
        topic,
        username,
        ip,
        code,
        device,
        isin,
        "time" as "createdAt"
       FROM logs
       ${where}
       ORDER BY "time" DESC
       LIMIT $1`,
      params
    );

    return { success: true, logs: result.rows };
  } catch (error: any) {
    setResponseStatus(event, 500);
    return { success: false, message: error.message };
  }
});