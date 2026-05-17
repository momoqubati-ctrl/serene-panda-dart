import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import { dbPool } from "../../../db";
import { guardAdminAction } from "../../../services/adminPermissions";

export default defineEventHandler(async (event) => {
  try {
    await guardAdminAction(event, "cp");

    const query = getQuery(event);
    const limit = Math.min(Number(query.limit) || 50, 100);
    const offset = Number(query.offset) || 0;
    const search = String(query.search || "").trim();

    let where = "";
    const params: any[] = [limit, offset];

    if (search) {
      params.push(`%${search}%`);
      where = `WHERE u_actor.topic ILIKE $3 OR u_target.topic ILIKE $3 OR r.topic ILIKE $3 OR me.event_type ILIKE $3`;
    }

    const result = await dbPool.query(
      `SELECT 
        me.id,
        me.event_type as "eventType",
        me.reason,
        me.created_at as "createdAt",
        me.metadata,
        u_actor.topic as "actorName",
        u_actor.power as "actorRole",
        u_target.topic as "targetName",
        u_target.idreg as "targetIdreg",
        r.topic as "roomName"
       FROM moderation_events me
       LEFT JOIN users u_actor ON me.actor_id = u_actor.id
       LEFT JOIN users u_target ON me.target_user_id = u_target.id
       LEFT JOIN rooms r ON me.room_id = r.id
       ${where}
       ORDER BY me.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    return { success: true, events: result.rows };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});